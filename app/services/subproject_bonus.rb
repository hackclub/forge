# Tops up an approved subproject to the coins it would have earned at its
# parent's tier, once both are approved. Scaling each member's snapshotted
# coins keeps their own streak and guild multipliers. Bonuses are coin
# adjustments tagged with the subproject, so the net per subproject tells
# whether it has already been paid.
class SubprojectBonus
  def self.award_for(project, actor:)
    subprojects_of(project).flat_map { |sub| new(sub).award!(actor: actor) }
  end

  def self.claw_back_for(project, actor:, reason:)
    subprojects_of(project).flat_map { |sub| new(sub).claw_back!(actor: actor, reason: reason) }
  end

  def self.subprojects_of(project)
    project.subproject? ? [ project ] : project.subprojects.to_a
  end

  def initialize(subproject)
    @subproject = subproject
    @parent = subproject.parent_project
  end

  def amounts
    return {} unless eligible?

    factor = (@parent.coin_rate / @subproject.coin_rate) - 1
    payouts = @subproject.project_payouts.includes(:user).to_a
    shares = payouts.any? ? payouts.map { |p| [ p.user, p.coins.to_f ] } : [ [ @subproject.user, @subproject.coins_earned ] ]
    shares.to_h.transform_values { |coins| (coins * factor).round(2) }.select { |_, coins| coins.positive? }
  end

  def award!(actor:)
    return [] if adjustments.sum(:amount).positive?

    amounts.map do |user, coins|
      user.coin_adjustments.create!(
        actor: actor,
        project: @subproject,
        amount: coins,
        reason: "Subproject bonus: #{@subproject.name} (##{@subproject.id}) topped up to #{@parent.name}'s #{@parent.tier.humanize} rate"
      )
    end
  end

  def claw_back!(actor:, reason:)
    adjustments.group(:user_id).sum(:amount).filter_map do |user_id, net|
      next unless net.positive?

      CoinAdjustment.create!(
        user_id: user_id,
        actor: actor,
        project: @subproject,
        amount: -net.to_f.round(2),
        reason: "Subproject bonus reversed for #{@subproject.name} (##{@subproject.id}): #{reason}"
      )
    end
  end

  private

  def eligible?
    @parent.present? && !@parent.discarded? && @parent.approved? &&
      !@subproject.discarded? && @subproject.approved? &&
      @subproject.coin_rate.positive? && @parent.coin_rate > @subproject.coin_rate
  end

  def adjustments
    CoinAdjustment.where(project: @subproject)
  end
end
