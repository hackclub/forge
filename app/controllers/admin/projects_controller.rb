class Admin::ProjectsController < Admin::ApplicationController
  before_action :require_projects_permission!
  before_action :set_project, only: [ :show, :review, :destroy, :restore, :toggle_hidden, :toggle_shadow_ban, :toggle_staff_pick, :change_tier, :add_note, :destroy_note, :update_note, :flag_for_review, :unflag_for_review, :mark_unbuilt, :reverse_review, :ai_requirements_check, :ai_requirements_check_status, :repo_tree, :changes_since_review, :send_checkpoint_message, :send_dm_message ]

  def index
    scope = policy_scope(Project).includes(:user, :ships)
    scope = params[:status] == "deleted" ? scope.discarded : scope.kept
    scope = scope.search(params[:query]) if params[:query].present?
    if params[:status] == "pending"
      scope = scope.where(status: [ :pending, :pitch_pending ])
    elsif params[:status].present? && params[:status] != "deleted"
      scope = scope.where(status: params[:status])
    end
    @pagy, @projects = pagy(scope.order(created_at: :desc))

    render inertia: "Admin/Projects/Index", props: {
      projects: @projects.map { |p| serialize_project_row(p) },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s,
      status_filter: params[:status].to_s,
      counts: status_counts,
      page_title: "All Projects"
    }
  end

  def pitches
    scope = policy_scope(Project).includes(:user, :ships).kept.where(status: :pitch_pending)
    scope = scope.search(params[:query]) if params[:query].present?
    @pagy, @projects = pagy(scope.order(created_at: :asc))

    render inertia: "Admin/Projects/Index", props: {
      projects: @projects.map { |p| serialize_project_row(p) },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s,
      status_filter: "pending",
      counts: status_counts,
      page_title: "Pitch Reviews",
      hide_filters: true
    }
  end

  def show
    authorize @project
    @notes = @project.project_notes.includes(:author).order(created_at: :desc)

    airtable_item = @project.airtable_queue_items.where.not(status: :cancelled).order(created_at: :desc).first
    airtable_status = if airtable_item&.airtable_record_id.present?
      { in_airtable: true, record_id: airtable_item.airtable_record_id }
    elsif airtable_item
      { in_airtable: false, queue_status: airtable_item.status }
    else
      { in_airtable: false }
    end

    render inertia: "Admin/Projects/Show", props: {
      project: serialize_project_detail(@project),
      notes: @notes.map { |n| serialize_note(n) },
      review_history: @project.admin_review_history.map { |e| serialize_review_event(e) },
      airtable_status: airtable_status,
      can: { review: policy(@project).review?, destroy: policy(@project).destroy?, restore: policy(@project).restore?, reverse: policy(@project).review? && %w[approved returned rejected].include?(@project.status) }
    }
  end

  def toggle_hidden
    authorize @project, :update?
    @project.update!(hidden: !@project.hidden)
    audit!("project.visibility_toggled", target: @project, metadata: { hidden: @project.hidden })
    status = @project.hidden? ? "hidden" : "visible"
    redirect_to admin_project_path(@project), notice: "Project is now #{status} on explore."
  end

  def toggle_shadow_ban
    authorize @project, :update?
    @project.update!(shadow_banned: !@project.shadow_banned)
    audit!("project.shadow_ban_toggled", target: @project, metadata: { shadow_banned: @project.shadow_banned })
    status = @project.shadow_banned? ? "shadow-banned" : "no longer shadow-banned"
    redirect_to admin_project_path(@project), notice: "Project is #{status}; hours hidden from metrics and leaderboard."
  end

  def toggle_staff_pick
    authorize @project, :update?
    @project.update!(staff_pick_at: @project.staff_pick? ? nil : Time.current)
    audit!("project.staff_pick_toggled", target: @project, metadata: { staff_pick: @project.staff_pick? })
    status = @project.staff_pick? ? "added to staff picks" : "removed from staff picks"
    redirect_to admin_project_path(@project), notice: "Project #{status}."
  end

  def restore
    authorize @project
    @project.undiscard
    audit!("project.restored", target: @project)
    redirect_to admin_project_path(@project), notice: "Project '#{@project.name}' has been restored."
  end

  def destroy
    authorize @project
    name = @project.name
    if @project.discarded?
      unless current_user.superadmin?
        redirect_to admin_project_path(@project), alert: "Only superadmins can permanently delete projects."
        return
      end

      audit!("project.destroyed", target: @project, label: name)
      @project.destroy
      redirect_to admin_projects_path, notice: "Project '#{name}' has been permanently deleted."
    else
      @project.discard
      audit!("project.soft_deleted", target: @project)
      redirect_to admin_projects_path, notice: "Project '#{name}' has been soft-deleted."
    end
  end

  def change_tier
    authorize @project, :review?

    if @project.build_review?
      redirect_to admin_project_path(@project), alert: "Build reviews have a fixed tier."
      return
    end

    new_tier = params[:tier].to_s
    unless Project::TIERS.include?(new_tier)
      redirect_to admin_project_path(@project), alert: "Invalid tier."
      return
    end

    old_tier = @project.tier
    if old_tier == new_tier
      redirect_to admin_project_path(@project)
      return
    end

    attrs = { tier: new_tier }
    if old_tier == "tier_1" && new_tier != "tier_1" && (@project.pitch_pending? || @project.draft?)
      attrs[:status] = :draft
    end
    @project.update!(attrs)
    audit!("project.tier_changed", target: @project, metadata: { old_tier: old_tier, new_tier: new_tier, auto_pending: attrs[:status] == :pending })

    if old_tier == "tier_1" && @project.slack_channel_id.present? && @project.slack_message_ts.present?
      app_url = ENV.fetch("APP_URL", "https://forge.hackclub.com")
      project_url = "#{app_url}/projects/#{@project.id}"
      user_mention = members_mention(@project)
      reviewer_mention = current_user.slack_id.present? ? "<@#{current_user.slack_id}>" : current_user.display_name
      rate = Project::TIER_COIN_RATES[new_tier]

      msg = ":arrows_counterclockwise: #{user_mention} Your project *#{@project.name}* has been moved to *#{new_tier.tr('_', ' ')}* (#{rate}c/hr) by #{reviewer_mention}."
      msg += "\n\n<#{project_url}|View Project>"

      SlackNotifyJob.perform_later(
        channel_id: @project.slack_channel_id,
        thread_ts: @project.slack_message_ts,
        text: msg
      )
    end

    redirect_to admin_project_path(@project), notice: "Tier changed from #{old_tier.tr('_', ' ')} to #{new_tier.tr('_', ' ')}."
  end

  def reverse_review
    authorize @project, :review?

    unless %w[approved returned rejected].include?(@project.status)
      redirect_to admin_project_path(@project), alert: "Only completed reviews can be reversed."
      return
    end

    reason = params[:reason].to_s.strip
    if reason.blank?
      redirect_to admin_project_path(@project), alert: "Provide a reason when reversing a review."
      return
    end

    previous_status = @project.status
    previous_reviewer_id = @project.reviewer_id
    previous_reviewed_at = @project.reviewed_at
    previous_coins_earned = @project.coins_earned
    refund_requested = ActiveModel::Type::Boolean.new.cast(params[:refund_coins])
    cancel_airtable = ActiveModel::Type::Boolean.new.cast(params[:cancel_airtable])
    notify_slack_flag = ActiveModel::Type::Boolean.new.cast(params[:notify_slack])
    cascade_target = (@project.build_review? && previous_status == "approved") ? @project.linked_project : nil

    payouts = @project.project_payouts.includes(:user).to_a
    refunded_members = []
    Project.transaction do
      @project.update!(
        status: :pending,
        reviewer: nil,
        reviewed_at: nil,
        review_feedback: nil,
        approval_justification: nil,
        streak_at_approval: nil,
        coins_awarded: nil
      )
      @project.project_payouts.destroy_all
      cascade_target&.update!(built_at: nil, build_proof_url: nil)

      if refund_requested
        if payouts.any?
          # Group project: claw back each member's snapshotted share.
          payouts.each do |payout|
            next unless payout.coins.to_f.positive?

            payout.user.coin_adjustments.create!(
              actor: current_user,
              amount: -payout.coins.to_f.round(2),
              reason: "Review reversed for project #{@project.name} (##{@project.id}), your share: #{reason}"
            )
            refunded_members << { user_id: payout.user_id, coins: payout.coins.to_f }
          end
        elsif previous_coins_earned.to_f.positive?
          @project.user.coin_adjustments.create!(
            actor: current_user,
            amount: -previous_coins_earned.to_f.round(2),
            reason: "Review reversed for project #{@project.name} (##{@project.id}): #{reason}"
          )
        end
      end
    end

    if cascade_target
      audit!("project.marked_unbuilt", target: cascade_target, metadata: { via: "build_review_reversed", build_review_id: @project.id })
    end

    airtable_warning = nil
    if cancel_airtable
      @project.airtable_queue_items.where.not(status: :cancelled).find_each do |item|
        if item.airtable_record_id.present?
          airtable_warning ||= "Project is already in Airtable (#{item.airtable_record_id}). Local queue item cancelled — delete the Airtable record manually if needed."
        end
        item.update(status: :cancelled)
      end
    end

    if notify_slack_flag && @project.tier == "tier_1" && @project.slack_channel_id.present? && @project.slack_message_ts.present?
      app_url = ENV.fetch("APP_URL", "https://forge.hackclub.com")
      project_url = "#{app_url}/projects/#{@project.id}"
      reviewer_mention = current_user.slack_id.present? ? "<@#{current_user.slack_id}>" : current_user.display_name
      user_mention = members_mention(@project)
      msg = ":arrows_counterclockwise: #{user_mention} The review of *#{@project.name}* was reversed by #{reviewer_mention}."
      msg += "\n\n*Reason:*\n> #{reason}"
      msg += "\n\n<#{project_url}|View Project>"
      SlackNotifyJob.perform_later(channel_id: @project.slack_channel_id, thread_ts: @project.slack_message_ts, text: msg)
    end

    audit!("project.review_reversed", target: @project, metadata: {
      reason: reason,
      previous_status: previous_status,
      previous_reviewer_id: previous_reviewer_id,
      previous_reviewed_at: previous_reviewed_at,
      previous_coins_earned: previous_coins_earned,
      refunded: refund_requested && (refunded_members.any? || previous_coins_earned.to_f.positive?),
      refunded_members: refunded_members.presence,
      cancelled_airtable: cancel_airtable,
      notified_slack: notify_slack_flag
    }.compact)

    redirect_to admin_project_path(@project), notice: airtable_warning || "Review reversed. Project is back to pending."
  end

  def mark_unbuilt
    authorize @project, :review?

    unless @project.built?
      redirect_to admin_project_path(@project), alert: "Project is not currently marked as built."
      return
    end

    previous_proof = @project.build_proof_url
    @project.update!(built_at: nil, build_proof_url: nil)
    audit!("project.marked_unbuilt", target: @project, metadata: { previous_build_proof_url: previous_proof })
    redirect_to admin_project_path(@project), notice: "Project marked as unbuilt."
  end

  def add_note
    authorize @project, :review?

    note = @project.project_notes.create!(content: params[:content], author: current_user)
    audit!("project.note_added", target: @project, metadata: { note_id: note.id, content: note.content })
    redirect_back fallback_location: admin_project_path(@project), notice: "Note added."
  end

  def update_note
    authorize @project, :review?

    note = @project.project_notes.find(params[:note_id])
    unless note.author_id == current_user.id || current_user.superadmin?
      redirect_back fallback_location: admin_project_path(@project), alert: "You can only edit your own notes."
      return
    end

    content = params[:content].to_s
    if content.strip.blank?
      redirect_back fallback_location: admin_project_path(@project), alert: "Note cannot be empty."
      return
    end

    note.update!(content: content)
    audit!("project.note_edited", target: @project, metadata: { note_id: note.id, content: note.content })
    redirect_back fallback_location: admin_project_path(@project), notice: "Note updated."
  end

  def destroy_note
    authorize @project, :review?

    note = @project.project_notes.find(params[:note_id])
    audit!("project.note_destroyed", target: @project, metadata: { note_id: note.id, content: note.content })
    note.destroy
    redirect_back fallback_location: admin_project_path(@project), notice: "Note deleted."
  end

  def flag_for_review
    authorize @project, :review?

    reason = params[:reason].to_s.strip
    if reason.blank?
      redirect_back fallback_location: admin_review_path(@project), alert: "A reason is required to flag a project."
      return
    end

    @project.update!(flagged_for_review_at: Time.current, flag_reason: reason, flagged_by: current_user)
    audit!("project.flagged_for_review", target: @project, metadata: { reason: reason })
    redirect_back fallback_location: admin_review_path(@project), notice: "Project flagged and pulled from the queue."
  end

  def unflag_for_review
    authorize @project, :review?

    unless current_user.superadmin?
      redirect_back fallback_location: admin_review_path(@project), alert: "Only superadmins can clear a review flag."
      return
    end

    @project.update!(flagged_for_review_at: nil, flag_reason: nil, flagged_by: nil)
    audit!("project.unflagged_for_review", target: @project)
    redirect_back fallback_location: admin_review_path(@project), notice: "Flag cleared; project is back in the queue."
  end

  def review
    authorize @project, :review?

    decision = params[:decision]
    feedback = params[:feedback]
    reasoning = params[:reasoning]
    is_pitch_stage = @project.pitch_pending?
    stage = is_pitch_stage ? :pitch : :project

    case decision
    when "approve"
      if is_pitch_stage
        if guard_duplicate_transition!(@project, :pitch_approved, "Pitch already approved.")
          return
        end
        @project.update!(status: :pitch_approved, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
        end_active_review_session(decision: "approved")
        audit!("project.pitch_approved", target: @project, metadata: { feedback: feedback })
        notify_slack_decision(@project, "approved", feedback, stage: stage)
        redirect_to admin_project_path(@project), notice: "Pitch approved."
      else
        if guard_duplicate_transition!(@project, :approved, "Project already approved.")
          return
        end
        if (error = override_invalid_reason(params[:override_hours], params[:override_hours_justification]))
          redirect_to admin_project_path(@project), alert: error
          return
        end
        capped = capped_override_hours(@project, params[:override_hours])
        approved_hours = capped || @project.devlog_hours
        justification = JustificationTemplate.render_for_project(
          project: @project,
          reviewer: current_user,
          claimed_hours: @project.devlog_hours,
          approved_hours: approved_hours,
          fields: justification_fields(reasoning: reasoning, feedback: feedback)
        )
        cascade_target = @project.build_review? ? @project.linked_project : nil
        payout_shares = nil
        Project.transaction do
          @project.update!(
            status: :approved,
            reviewer: current_user,
            reviewed_at: Time.current,
            review_feedback: feedback,
            override_hours: capped,
            override_hours_justification: params[:override_hours_justification].presence,
            approval_justification: justification,
            streak_at_approval: @project.user.current_streak
          )
          if @project.group_project?
            calculator = ProjectPayoutCalculator.new(@project)
            payout_shares = calculator.shares
            payout_shares.each do |share|
              @project.project_payouts.create!(
                user: share.user,
                hours: share.hours,
                coins: share.coins,
                streak_at_approval: share.streak_at_approval,
                streak_multiplier: share.streak_multiplier,
                guild_multiplier: share.guild_multiplier
              )
            end
            @project.update_column(:coins_awarded, calculator.total)
          else
            @project.update_column(:coins_awarded, @project.computed_coins)
          end
          cascade_target&.update!(built_at: Time.current)
        end
        end_active_review_session(decision: "approved")
        audit!("project.approved", target: @project, metadata: {
          feedback: feedback,
          override_hours: capped,
          reasoning: reasoning,
          build_review: @project.build_review,
          justification: justification,
          approved_hours: approved_hours.to_f,
          coins_awarded: @project.coins_awarded.to_f,
          member_breakdown: payout_shares&.map { |s|
            { user_id: s.user.id, display_name: s.user.display_name, hours: s.hours, coins: s.coins,
              streak_multiplier: s.streak_multiplier, guild_multiplier: s.guild_multiplier }
          }
        }.compact)
        if cascade_target
          audit!("project.marked_built", target: cascade_target, metadata: { via: "build_review", build_review_id: @project.id })
        end
        # Intentionally owner-based: referral credit goes to the project owner's
        # referrer even on group projects.
        ReferralEligibility.mark(@project)
        notify_slack_decision(@project, "approved! :tada:", feedback, stage: stage)
        RecordReviewedCommitShaJob.perform_later(@project.id)
        redirect_to admin_review_path(@project), notice: @project.build_review? ? "Build review approved." : "Project approved."
      end
    when "return"
      if guard_duplicate_transition!(@project, :returned, "Project already returned.")
        return
      end
      @project.update!(status: :returned, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      end_active_review_session(decision: "returned")
      audit!("project.returned", target: @project, metadata: { feedback: feedback, stage: stage })
      notify_slack_decision(@project, "returned for changes", feedback, stage: stage)
      RecordReviewedCommitShaJob.perform_later(@project.id)
      redirect_to admin_review_path(@project), notice: "Project returned to builder."
    when "reject"
      if guard_duplicate_transition!(@project, :rejected, "Project already rejected.")
        return
      end
      @project.update!(status: :rejected, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      end_active_review_session(decision: "rejected")
      audit!("project.rejected", target: @project, metadata: { feedback: feedback, stage: stage })
      notify_slack_decision(@project, "rejected", feedback, stage: stage)
      RecordReviewedCommitShaJob.perform_later(@project.id)
      redirect_to admin_review_path(@project), notice: "Project rejected."
    when "draft"
      if guard_duplicate_transition!(@project, :draft, "Project already in draft.")
        return
      end
      @project.update!(status: :draft, reviewer: current_user, reviewed_at: Time.current, review_feedback: feedback)
      audit!("project.reverted_to_draft", target: @project, metadata: { feedback: feedback })
      redirect_to admin_project_path(@project), notice: "Project reverted to draft."
    when "save_review_notes"
      if (error = override_invalid_reason(params[:override_hours], params[:override_hours_justification]))
        redirect_to admin_project_path(@project), alert: error
        return
      end
      capped = capped_override_hours(@project, params[:override_hours])
      @project.update!(
        override_hours: capped,
        override_hours_justification: params[:override_hours_justification].presence
      )
      audit!("project.review_notes_saved", target: @project, metadata: { override_hours: capped })
      redirect_to admin_project_path(@project), notice: "Review notes saved."
    when "refresh_readme"
      FetchReadmeJob.perform_later(@project.id)
      audit!("project.readme_refreshed", target: @project)
      redirect_back fallback_location: admin_project_path(@project), notice: "Fetching latest README..."
    else
      redirect_to admin_project_path(@project), alert: "Invalid review decision."
    end
  end

  def ai_requirements_check
    authorize @project, :review?

    @project.update_columns(ai_check_result: { "status" => "queued", "queued_at" => Time.current.iso8601 })
    RunReviewerAiCheckJob.perform_later(@project.id)
    audit!("project.ai_check_run", target: @project, metadata: { via: "reviewer" })

    render json: { status: "queued" }
  end

  def ai_requirements_check_status
    authorize @project, :review?
    render json: { result: @project.ai_check_result_for_display, ran_at: @project.ai_check_ran_at&.iso8601 }
  end

  def repo_tree
    authorize @project, :review?

    ctx = ForgeChecks::Context.new(@project)
    source = ctx.github? ? "github" : (ctx.gitlab? ? "gitlab" : nil)
    unless ctx.supported_repo?
      render json: { paths: [], source: nil, blob_base: nil, fetched_at: nil, error: nil }
      return
    end

    cache_key = [ "admin/repo_tree", @project.id, @project.repo_link ]
    Rails.cache.delete(cache_key) if params[:refresh].present?
    cached = Rails.cache.read(cache_key)

    if cached.nil?
      paths = ctx.repo_tree
      if paths
        cached = { "paths" => paths, "fetched_at" => Time.current.iso8601 }
        Rails.cache.write(cache_key, cached, expires_in: 30.minutes)
      end
    end

    if cached.nil?
      render json: {
        paths: [], source: source, blob_base: blob_base_for(ctx), fetched_at: nil,
        error: "Couldn't fetch the repository tree (rate limit or private repo). Try again."
      }
      return
    end

    render json: {
      paths: cached["paths"] || [],
      fetched_at: cached["fetched_at"],
      source: source,
      blob_base: blob_base_for(ctx),
      error: nil
    }
  end

  def changes_since_review
    authorize @project, :review?

    ctx = ForgeChecks::Context.new(@project)
    base = @project.reviewed_commit_sha

    if @project.repo_link.blank?
      render json: { available: false, reason: "no_repo" }
      return
    end
    unless ctx.github?
      render json: { available: false, reason: "unsupported_host" }
      return
    end
    if base.blank?
      render json: { available: false, reason: "no_baseline" }
      return
    end

    head = ctx.head_sha
    if head.blank?
      render json: { available: false, reason: "error", message: "Couldn't read the repository's latest commit." }
      return
    end
    if head == base
      render json: { available: true, base_sha: base, head_sha: head, total_commits: 0, files: [], commits: [], html_url: nil }
      return
    end

    cache_key = [ "admin/changes_since_review", @project.id, base, head ]
    Rails.cache.delete(cache_key) if params[:refresh].present?
    data = Rails.cache.read(cache_key)

    if data.nil?
      cmp = ctx.compare(base, head)
      if cmp.nil?
        render json: { available: false, reason: "error", message: "Couldn't fetch the diff (rate limit or private repo)." }
        return
      end
      data = {
        "base_sha" => base,
        "head_sha" => head,
        "ahead_by" => cmp["ahead_by"],
        "total_commits" => cmp["total_commits"] || Array(cmp["commits"]).size,
        "html_url" => cmp["html_url"],
        "files" => Array(cmp["files"]).first(100).map { |f|
          { "filename" => f["filename"], "status" => f["status"], "additions" => f["additions"], "deletions" => f["deletions"] }
        },
        "commits" => Array(cmp["commits"]).last(20).reverse.map { |c|
          { "sha" => c["sha"].to_s[0, 7], "message" => c.dig("commit", "message").to_s.split("\n").first,
            "author" => c.dig("commit", "author", "name") }
        }
      }
      Rails.cache.write(cache_key, data, expires_in: 10.minutes)
    end

    render json: { available: true }.merge(data)
  end

  def send_checkpoint_message
    authorize @project, :review?

    channel = ENV["FORGE_CHECKPOINT_CHANNEL_ID"].to_s.strip
    if channel.blank?
      redirect_back fallback_location: admin_review_path(@project), alert: "FORGE_CHECKPOINT_CHANNEL_ID is not set."
      return
    end

    body = params[:body].to_s.strip
    user_slack_id = params[:user_slack_id].to_s.strip
    if body.blank?
      redirect_back fallback_location: admin_review_path(@project), alert: "Message body is required."
      return
    end
    if user_slack_id.blank?
      redirect_back fallback_location: admin_review_path(@project), alert: "Builder Slack ID is required."
      return
    end

    user_mention = "<@#{user_slack_id}>"
    reviewer_mention = current_user.slack_id.present? ? "<@#{current_user.slack_id}>" : current_user.display_name

    text = "Hey #{user_mention}! Our team of smiths have had a look at your project and here's what we had to say!\n\n#{body}\n\nFrom #{reviewer_mention}, please discuss in this thread for any questions/feedback!"

    client = Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
    response = client.chat_postMessage(channel: channel, text: text)

    if response["ts"].present?
      app_url = ENV.fetch("APP_URL", "https://forge.hackclub.com")
      project_url = "#{app_url}/projects/#{@project.id}"
      client.chat_postMessage(channel: channel, thread_ts: response["ts"], text: "Project: #{project_url}")
    end

    audit!("project.checkpoint_message_sent", target: @project, metadata: { user_slack_id: user_slack_id })
    redirect_back fallback_location: admin_review_path(@project), notice: "Checkpoint message sent."
  rescue Slack::Web::Api::Errors::SlackError => e
    redirect_back fallback_location: admin_review_path(@project), alert: "Slack error: #{e.message}"
  end

  def send_dm_message
    authorize @project, :review?

    body = params[:body].to_s.strip
    user_slack_id = params[:user_slack_id].to_s.strip
    if body.blank?
      redirect_back fallback_location: admin_review_path(@project), alert: "Message body is required."
      return
    end
    if user_slack_id.blank?
      redirect_back fallback_location: admin_review_path(@project), alert: "Builder Slack ID is required."
      return
    end

    reviewer_mention = current_user.slack_id.present? ? "<@#{current_user.slack_id}>" : current_user.display_name
    text = "Hey! Our team of smiths have had a look at your project and here's what we had to say!\n\n#{body}\n\nFrom #{reviewer_mention} — please DM your reviewer if you have any questions, or resubmit once you've worked on this feedback!"

    client = Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
    client.chat_postMessage(channel: user_slack_id, text: text)

    audit!("project.dm_message_sent", target: @project, metadata: { user_slack_id: user_slack_id })
    redirect_back fallback_location: admin_review_path(@project), notice: "DM sent to builder."
  rescue Slack::Web::Api::Errors::SlackError => e
    redirect_back fallback_location: admin_review_path(@project), alert: "Slack error: #{e.message}"
  end

  private

  def end_active_review_session(decision:)
    return unless current_user
    ReviewSession.active.for_reviewer(current_user).for_project(@project).find_each do |s|
      s.end!(decision: decision)
    end
  end

  def require_projects_permission!
    require_permission!("projects")
  end

  def guard_duplicate_transition!(project, target_status, message)
    return false unless project.status.to_s == target_status.to_s

    redirect_to admin_project_path(project), alert: message
    true
  end

  def justification_fields(reasoning:, feedback:)
    {
      time_summary: params[:time_summary],
      scope_reasoning: params[:scope_reasoning],
      evidence: params[:evidence],
      assessment: reasoning.presence || feedback.to_s,
      deflation_reason: params[:override_hours_justification]
    }
  end

  def capped_override_hours(project, raw)
    return nil if raw.blank?

    value = raw.to_f
    ceiling = project.devlog_hours
    value = ceiling if value > ceiling
    value
  end

  def override_invalid_reason(raw_hours, raw_justification)
    return nil if raw_hours.blank?

    return "Override hours cannot be negative." if raw_hours.to_f.negative?
    return "Override justification is required when overriding hours." if raw_justification.to_s.strip.blank?

    nil
  end

  # Mentions every team member (owner + collaborators), not just the owner.
  def members_mention(project)
    project.members.map { |m| m.slack_id.present? ? "<@#{m.slack_id}>" : m.display_name }.join(" ")
  end

  def notify_slack_decision(project, decision, feedback, stage: :project)
    return unless project.slack_channel_id.present? && project.slack_message_ts.present?

    emoji = case decision
    when /approved/ then ":white_check_mark:"
    when "rejected" then ":x:"
    else ":arrows_counterclockwise:"
    end

    app_url = ENV.fetch("APP_URL", "https://forge.hackclub.com")
    project_url = "#{app_url}/projects/#{project.id}"

    reviewer_mention = current_user.slack_id.present? ? "<@#{current_user.slack_id}>" : current_user.display_name
    user_mention = members_mention(project)
    subject = stage == :pitch ? "pitch for *#{project.name}*" : "project *#{project.name}*"
    msg = "#{emoji} #{user_mention} Your #{subject} has been *#{decision}* by #{reviewer_mention}."
    msg += "\n\n*Reviewer feedback:*\n> #{feedback}" if feedback.present?

    if decision.include?("returned") && stage == :pitch
      msg += "\n\n:pencil2: *Edit your original pitch message above* with the requested changes, then open your project and click *Resubmit Pitch*."
      msg += "\n\n:point_right: <#{project_url}|Open Project>"
    else
      msg += "\n\n<#{project_url}|View Project>"
    end

    reaction = case decision
    when /approved/ then "yay"
    when "rejected" then "x"
    else "clock1"
    end

    SlackNotifyJob.perform_later(
      channel_id: project.slack_channel_id,
      thread_ts: project.slack_message_ts,
      text: msg,
      reaction: reaction
    )
  end

  def status_counts
    kept_scope = policy_scope(Project).kept
    raw = kept_scope.group(:status).count
    pending_count = (raw["pending"] || 0) + (raw["pitch_pending"] || 0)
    {
      all: raw.values.sum,
      pending: pending_count,
      approved: raw["approved"] || 0,
      pitch_approved: raw["pitch_approved"] || 0,
      returned: raw["returned"] || 0,
      rejected: raw["rejected"] || 0,
      draft: raw["draft"] || 0,
      deleted: policy_scope(Project).discarded.count
    }
  end

  def set_project
    @project = Project.find(params[:id])
  end

  def blob_base_for(ctx)
    if ctx.github?
      "https://github.com/#{ctx.github_match[1]}/#{ctx.github_match[2]}/blob/HEAD/"
    elsif ctx.gitlab?
      "https://gitlab.com/#{ctx.gitlab_match[1]}/-/blob/HEAD/"
    end
  end

  def serialize_project_row(project)
    {
      id: project.id,
      name: project.name,
      status: project.status,
      user_id: project.user_id,
      user_display_name: project.user.display_name,
      ships_count: project.ships.size,
      is_discarded: project.discarded?,
      created_at: project.created_at.strftime("%b %d, %Y")
    }
  end

  def serialize_project_detail(project)
    {
      id: project.id,
      name: project.name,
      subtitle: project.subtitle,
      description: project.description,
      red_flags: project.red_flags || [],
      green_flags: project.green_flags || [],
      repo_link: project.repo_link,
      tags: project.tags,
      status: project.status,
      review_feedback: project.review_feedback,
      reviewed_at: project.reviewed_at&.strftime("%b %d, %Y"),
      reviewer_display_name: project.reviewer&.display_name,
      is_discarded: project.discarded?,
      discarded_at: project.discarded_at&.strftime("%b %d, %Y"),
      pitch_text: project.pitch_text,
      from_slack: project.slack_message_ts.present?,
      slack_url: project.slack_channel_id.present? && project.slack_message_ts.present? ? "https://hackclub.slack.com/archives/#{project.slack_channel_id}/p#{project.slack_message_ts.to_s.delete('.')}" : nil,
      tier: project.tier,
      budget: project.budget,
      cover_image_url: project.cover_image_url,
      override_hours: project.override_hours&.to_f,
      override_hours_justification: project.override_hours_justification,
      readme_cache: project.readme_cache,
      readme_fetched_at: project.readme_fetched_at&.strftime("%b %d, %Y %H:%M"),
      total_hours: project.total_hours,
      devlog_hours: project.devlog_hours,
      devlogs: project.devlogs.order(id: :desc).map { |d| serialize_devlog(d) },
      hidden: project.hidden,
      shadow_banned: project.shadow_banned,
      staff_pick: project.staff_pick?,
      built_at: project.built_at&.strftime("%b %d, %Y"),
      build_proof_url: project.build_proof_url,
      build_review: project.build_review,
      linked_project: project.linked_project ? { id: project.linked_project.id, name: project.linked_project.name } : nil,
      user_id: project.user_id,
      user_display_name: project.user.display_name,
      user_email: project.user.email,
      user_has_address: project.user.address_line1.present?,
      members: project.members.map { |m|
        { user_id: m.id, display_name: m.display_name, avatar: m.avatar, is_owner: m.id == project.user_id }
      },
      payouts: project.project_payouts.includes(:user).map { |p|
        {
          user_id: p.user_id,
          display_name: p.user.display_name,
          hours: p.hours.to_f,
          coins: p.coins.to_f,
          streak_multiplier: p.streak_multiplier&.to_f,
          guild_multiplier: p.guild_multiplier&.to_f
        }
      },
      created_at: project.created_at.strftime("%b %d, %Y")
    }
  end

  def serialize_devlog(devlog)
    details = devlog.requirement_validation_details
    {
      id: devlog.id,
      title: devlog.title,
      content: devlog.content,
      time_spent: devlog.time_spent,
      time_hours: devlog.time_hours&.to_f,
      lapse_url: devlog.lapse_url,
      created_at: devlog.created_at.strftime("%b %d, %Y"),
      meets_requirements: devlog.meets_submission_requirements?,
      validation: {
        content_length: details[:content_length],
        min_content_length: details[:min_content_length],
        has_image: details[:has_image],
        meets_length_requirement: details[:meets_length_requirement],
        meets_image_requirement: details[:meets_image_requirement]
      }
    }
  end

  def serialize_review_event(event)
    meta = event.metadata || {}
    {
      id: event.id,
      action: event.action,
      stage: meta["stage"],
      feedback: meta["feedback"].presence || meta["reason"].presence,
      internal_justification: meta["justification"].presence || meta["reasoning"].presence,
      old_tier: meta["old_tier"],
      new_tier: meta["new_tier"],
      approved_hours: meta["approved_hours"],
      override_hours: meta["override_hours"],
      coins_awarded: meta["coins_awarded"],
      refunded_coins: meta["refunded"] ? meta["previous_coins_earned"] : nil,
      member_breakdown: meta["member_breakdown"],
      reviewer_display_name: event.actor&.display_name,
      reviewer_avatar: event.actor&.avatar,
      target_type: event.target_type,
      target_label: event.target_label,
      created_at: event.created_at.strftime("%b %d, %Y %H:%M")
    }
  end

  def serialize_note(note)
    {
      id: note.id,
      content: note.content,
      author_name: note.author.display_name,
      author_avatar: note.author.avatar,
      created_at: note.created_at.strftime("%b %d, %Y %H:%M")
    }
  end
end
