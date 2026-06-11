require "test_helper"

class UserCoinsEarnedTest < ActiveSupport::TestCase
  setup do
    @owner = users(:one)
    @collaborator = users(:two)
    @project = projects(:one)
  end

  test "solo projects pay the owner in full (legacy path)" do
    @project.update!(status: :approved)
    @project.update_column(:coins_awarded, 20.0)

    assert_equal 20.0, @owner.coins_earned
    assert_equal 0.0, @collaborator.coins_earned
  end

  test "group projects pay each member their payout share" do
    @project.update!(status: :approved)
    @project.update_column(:coins_awarded, 12.0)
    @project.project_collaborators.create!(user: @collaborator)
    @project.project_payouts.create!(user: @owner, hours: 2, coins: 8.0)
    @project.project_payouts.create!(user: @collaborator, hours: 1, coins: 4.0)

    assert_equal 8.0, @owner.coins_earned
    assert_equal 4.0, @collaborator.coins_earned
  end

  test "discarded projects pay nobody" do
    @project.update!(status: :approved)
    @project.update_column(:coins_awarded, 12.0)
    @project.project_payouts.create!(user: @owner, hours: 2, coins: 8.0)
    @project.project_payouts.create!(user: @collaborator, hours: 1, coins: 4.0)
    @project.discard

    assert_equal 0.0, @owner.coins_earned
    assert_equal 0.0, @collaborator.coins_earned
  end
end
