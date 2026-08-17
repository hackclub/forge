class StreakService
  def self.record_activity(user, date = nil)
    today = user.today_in_zone
    date ||= today
    date = today if date > today

    day = StreakDay.find_or_initialize_by(user: user, date: date)
    unless day.status_active? || day.status_frozen?
      day.status = :active
      day.save!
    end

    reconcile_missed_days(user, today)
  rescue ActiveRecord::RecordNotUnique
    reconcile_missed_days(user, today)
    nil
  end

  # Resolves every day between the user's last streak-counting day and today.
  # Freezes are only spent when they cover the whole gap — a partial fill can't
  # save the streak and just burns freezes silently.
  def self.reconcile_missed_days(user, today = user.today_in_zone)
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
