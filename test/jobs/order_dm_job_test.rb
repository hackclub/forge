require "test_helper"

class OrderDmJobTest < ActiveSupport::TestCase
  def order(attrs = {})
    Order.new({ kind: "supercon_ticket", coin_cost: 300, user: User.new(display_name: "Ada <3") }.merge(attrs))
  end

  test "rejected orders quote the review notes" do
    text = OrderDmJob.message_for(order(status: :rejected, review_notes: "not eligible\ntry again"))

    assert_includes text, "Hey Ada &lt;3, your order for Supercon ticket was rejected:"
    assert_includes text, "> not eligible\n> try again"
  end

  test "fulfilled grant orders include the grant link" do
    text = OrderDmJob.message_for(order(status: :fulfilled, hcb_grant_link: "https://hcb.hackclub.com/grants/1"))

    assert_includes text, "was fulfilled:"
    assert_includes text, "*HCB Grant:* https://hcb.hackclub.com/grants/1"
  end

  test "fulfilled physical orders mention shipping" do
    assert_includes OrderDmJob.message_for(order(status: :fulfilled)), "The item will be shipped to you."
  end

  test "pending and approved orders send nothing" do
    assert_nil OrderDmJob.message_for(order(status: :pending))
    assert_nil OrderDmJob.message_for(order(status: :approved))
  end
end
