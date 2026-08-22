class StreakService
  MIN_DAILY_HOURS = 1.0

  # Days before this keep the old any-activity rule, so shipping the hours
  # requirement can't retroactively break an existing streak.
  HOURS_REQUIRED_FROM = Date.new(2026, 8, 22)

  # A git sync landing after midnight still earns its day; older backdated
  # entries can't revive history.
  BACKFILL_WINDOW_DAYS = 2

  def self.hours_required?(date)
    date >= HOURS_REQUIRED_FROM
  end

  def self.earned?(date, hours)
    hours_required?(date) ? hours >= MIN_DAILY_HOURS : hours.positive?
  end

  def self.hours_logged_on(user, date)
    Devlog.where(user: user, entry_date: date).reorder(nil).sum(:time_hours).to_f
  end

  def self.record_activity(user, date = nil)
    today = user.today_in_zone
    date ||= today
    date = today if date > today

    recompute_day(user, date, today: today)
    reconcile_missed_days(user, today)
  rescue ActiveRecord::RecordNotUnique
    reconcile_missed_days(user, today)
    nil
  end

  # Never demotes a day that already counts, so legacy days, admin grants and
  # freezes survive a recompute.
  def self.recompute_day(user, date, today: user.today_in_zone)
    return nil if date > today
    return nil if date < today - BACKFILL_WINDOW_DAYS

    day = StreakDay.find_or_initialize_by(user: user, date: date)
    apply_hours(day, hours_logged_on(user, date), today)
    day
  end

  def self.refresh_recent_days(user, today = user.today_in_zone)
    window = (today - BACKFILL_WINDOW_DAYS)..today
    totals = Devlog.where(user: user, entry_date: window).reorder(nil).group(:entry_date).sum(:time_hours)
    existing = StreakDay.where(user: user, date: window).index_by(&:date)

    window.each do |date|
      apply_hours(existing[date] || StreakDay.new(user: user, date: date), totals[date].to_f, today)
    end
  end

  # Resolves every day between the user's last streak-counting day and today.
  # Freezes are only spent when they cover the whole gap — a partial fill can't
  # save the streak and just burns freezes silently.
  def self.reconcile_missed_days(user, today = user.today_in_zone)
    refresh_recent_days(user, today)

    user.with_lock do
      last = StreakDay.where(user: user).streak_counting.where(date: ...today).maximum(:date)
      next if last.nil?

      gap = ((last + 1)...today).to_a
      next if gap.empty?

      if user.streak_freezes.to_i >= gap.size
        freeze_days(user, gap)
      else
        gap.each { |date| mark(user, date, :missed) }
      end
    end
  end

  private_class_method def self.apply_hours(day, hours, today)
    return nil if day.new_record? && hours.zero?

    day.hours_logged = hours

    unless day.status_active? || day.status_frozen?
      day.status = if earned?(day.date, hours)
        :active
      elsif day.date == today
        :pending
      else
        day.status
      end
    end

    day.save! if day.changed?
    day
  rescue ActiveRecord::RecordNotUnique
    nil
  end

  private_class_method def self.freeze_days(user, dates)
    rows = User.where(id: user.id).where("streak_freezes >= ?", dates.size)
      .update_all("streak_freezes = streak_freezes - #{dates.size}")
    return if rows.zero?

    dates.each { |date| mark(user, date, :frozen) }
    user.reload
  end

  private_class_method def self.mark(user, date, status)
    day = StreakDay.find_or_initialize_by(user: user, date: date)
    return if day.status == status.to_s

    day.status = status
    day.save!
  end
end
