require "test_helper"

class ProjectPayoutCalculatorTest < ActiveSupport::TestCase
  setup do
    @project = projects(:one) # tier_4 => 4.0 coins/hr
    @owner = users(:one)
    @collaborator = users(:two)
    @project.project_collaborators.create!(user: @collaborator)
  end

  def add_devlog(user, hours)
    @project.devlogs.create!(user: user, title: "Entry", content: "Did things", time_spent: "#{hours} hours")
  end

  test "splits coins proportionally by devlog hours" do
    add_devlog(@owner, 2)
    add_devlog(@collaborator, 1)

    calculator = ProjectPayoutCalculator.new(@project)
    shares = calculator.shares.index_by { |s| s.user.id }

    assert_equal 2.0, shares[@owner.id].hours
    assert_equal 8.0, shares[@owner.id].coins
    assert_equal 1.0, shares[@collaborator.id].hours
    assert_equal 4.0, shares[@collaborator.id].coins
    assert_equal 12.0, calculator.total
  end

  test "scales hours proportionally when an override is set" do
    add_devlog(@owner, 2)
    add_devlog(@collaborator, 1)
    @project.update!(override_hours: 1.5)

    calculator = ProjectPayoutCalculator.new(@project)
    shares = calculator.shares.index_by { |s| s.user.id }

    assert_equal 1.0, shares[@owner.id].hours
    assert_equal 0.5, shares[@collaborator.id].hours
    assert_equal 6.0, calculator.total
  end

  test "skips members with zero hours" do
    add_devlog(@owner, 3)

    calculator = ProjectPayoutCalculator.new(@project)
    assert_equal [ @owner.id ], calculator.shares.map { |s| s.user.id }
  end

  test "pays ex-members whose devlogs remain on the project" do
    add_devlog(@owner, 1)
    add_devlog(@collaborator, 1)
    @project.project_collaborators.find_by(user: @collaborator).destroy

    calculator = ProjectPayoutCalculator.new(@project)
    assert_includes calculator.shares.map { |s| s.user.id }, @collaborator.id
  end

  test "total equals the sum of individually rounded shares" do
    add_devlog(@owner, 1.33)
    add_devlog(@collaborator, 2.67)

    calculator = ProjectPayoutCalculator.new(@project)
    assert_equal calculator.shares.sum(&:coins).round(2), calculator.total
  end

  test "snapshots each member's own multipliers" do
    add_devlog(@owner, 1)
    share = ProjectPayoutCalculator.new(@project).shares.first

    assert_equal @owner.streak_multiplier(share.streak_at_approval), share.streak_multiplier
    assert_equal GuildState.multiplier_for(@owner.guild), share.guild_multiplier
  end
end
