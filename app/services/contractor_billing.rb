class ContractorBilling
  TIME_ZONE = "America/New_York".freeze
  DECISIONS = {
    "project.approved" => "approved",
    "project.returned" => "returned",
    "project.rejected" => "rejected"
  }.freeze
  REVERSAL_ACTION = "project.review_reversed".freeze

  def self.zone
    ActiveSupport::TimeZone[TIME_ZONE]
  end

  def self.week_start_for(time)
    time.in_time_zone(zone).to_date.beginning_of_week(:monday)
  end

  def self.current_week_start
    week_start_for(Time.current)
  end

  def self.week_range(week_start)
    start = zone.local(week_start.year, week_start.month, week_start.day)
    start...(start + 1.week)
  end

  def initialize(agreement)
    @agreement = agreement
  end

  def summary(range)
    events = decision_events(range)
    reversed = reversed_event_ids(events)
    projects = Project.where(id: events.map(&:target_id).uniq).pluck(:id, :name, :build_review).to_h { |id, name, build| [ id, { name: name, build_review: build } ] }
    items = events.map { |event| line_item(event, projects[event.target_id], reversed.include?(event.id)) }

    {
      line_items: items.map(&:stringify_keys),
      review_count: items.count { |item| item[:flag].nil? },
      total_cents: items.sum { |item| item[:amount_cents] }
    }
  end

  def generate_invoices!
    last_week = self.class.current_week_start - 1.week
    week = self.class.week_start_for(@agreement.billable_from)
    existing = @agreement.user.contractor_invoices.where(week_start: week..last_week).index_by(&:week_start)

    while week <= last_week
      invoice = existing[week]
      attrs = invoice.nil? || invoice.pending_signature? ? summary(self.class.week_range(week)) : nil

      if invoice.nil?
        @agreement.contractor_invoices.create!(user: @agreement.user, week_start: week, **attrs) if attrs[:line_items].any?
      elsif attrs && attrs[:line_items].empty?
        invoice.destroy!
      elsif attrs
        invoice.update!(attrs)
      end

      week += 1.week
    end
  end

  private

  def decision_events(range)
    start = [ range.begin, @agreement.billable_from ].max
    return AuditEvent.none if start >= range.end

    AuditEvent
      .where(actor_id: @agreement.user_id, target_type: "Project", action: DECISIONS.keys, created_at: start...range.end)
      .where("COALESCE(metadata->>'stage', '') <> 'pitch'")
      .where("COALESCE(metadata->>'requirements_check', 'false') <> 'true'")
      .order(:created_at)
      .to_a
  end

  def reversed_event_ids(events)
    return Set.new if events.empty?

    last_decision = {}
    reversed = Set.new
    AuditEvent
      .where(target_type: "Project", target_id: events.map(&:target_id).uniq, action: DECISIONS.keys + [ REVERSAL_ACTION ])
      .where(created_at: events.first.created_at..)
      .order(:created_at)
      .pluck(:id, :target_id, :action)
      .each do |id, target_id, action|
        if action == REVERSAL_ACTION
          reversed << last_decision.delete(target_id) if last_decision[target_id]
        else
          last_decision[target_id] = id
        end
      end
    reversed
  end

  def line_item(event, project, reversed)
    decision = DECISIONS.fetch(event.action)
    flag =
      if reversed
        "reversed"
      elsif decision == "approved" && event.metadata["reasoning"].blank?
        "no_justification"
      end

    {
      audit_event_id: event.id,
      project_id: event.target_id,
      project_name: project&.dig(:name) || event.target_label,
      build_review: project&.dig(:build_review) || false,
      decision: decision,
      reviewed_at: event.created_at.iso8601,
      flag: flag,
      amount_cents: flag ? 0 : @agreement.rate_cents_for(decision)
    }
  end
end
