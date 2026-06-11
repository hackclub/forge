class CollaborationInvitesController < ApplicationController
  before_action :set_project, only: %i[create destroy]
  before_action :set_invite, only: %i[accept decline]

  def create
    identifier = params[:identifier].to_s.strip
    if identifier.blank?
      redirect_to @project, alert: "Enter an email or Slack ID to invite someone."
      return
    end

    invitee = User.kept.where("LOWER(email) = ? OR slack_id = ?", identifier.downcase, identifier).first
    unless invitee
      redirect_to @project, alert: "No Forge user found with that email or Slack ID. They need an account first."
      return
    end

    invite = @project.collaboration_invites.build(inviter: current_user, invitee: invitee)
    authorize invite

    if invite.save
      audit!("collaboration_invite.created", target: @project, metadata: { invite_id: invite.id, invitee_id: invitee.id })
      notify_invitee(invite)
      redirect_to @project, notice: "Invite sent to #{invitee.display_name}."
    else
      redirect_to @project, alert: invite.errors.full_messages.join(", ")
    end
  end

  def destroy
    invite = @project.collaboration_invites.find(params[:id])
    authorize invite, :revoke?

    invite.revoke!
    audit!("collaboration_invite.revoked", target: @project, metadata: { invite_id: invite.id, invitee_id: invite.invitee_id })
    redirect_to @project, notice: "Invite revoked."
  rescue CollaborationInvite::NotActionable => e
    redirect_to @project, alert: e.message
  end

  def accept
    authorize @invite

    @invite.accept!
    audit!("collaboration_invite.accepted", target: @invite.project, metadata: { invite_id: @invite.id, inviter_id: @invite.inviter_id })
    redirect_to @invite.project, notice: "You've joined #{@invite.project.name}!"
  rescue CollaborationInvite::NotActionable, ActiveRecord::RecordInvalid => e
    message = e.is_a?(ActiveRecord::RecordInvalid) ? e.record.errors.full_messages.join(", ") : e.message
    redirect_to root_path, alert: message
  end

  def decline
    authorize @invite

    @invite.decline!
    audit!("collaboration_invite.declined", target: @invite.project, metadata: { invite_id: @invite.id, inviter_id: @invite.inviter_id })
    redirect_to root_path, notice: "Invite declined."
  rescue CollaborationInvite::NotActionable => e
    redirect_to root_path, alert: e.message
  end

  private

  def set_project
    @project = Project.kept.find(params[:project_id])
  end

  def set_invite
    @invite = CollaborationInvite.find(params[:id])
  end

  def notify_invitee(invite)
    return if invite.invitee.slack_id.blank?

    app_url = ENV.fetch("APP_URL", "https://forge.hackclub.com")
    inviter_mention = current_user.slack_id.present? ? "<@#{current_user.slack_id}>" : current_user.display_name
    text = ":wave: #{inviter_mention} invited you to join *#{invite.project.name}* on Forge!" \
           "\n\nAccept or decline from your <#{app_url}/home|Forge home page>."

    # Posting to a user ID opens a DM with that user.
    SlackNotifyJob.perform_later(channel_id: invite.invitee.slack_id, thread_ts: nil, text: text)
  end
end
