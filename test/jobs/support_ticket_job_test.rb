require "test_helper"

class SupportTicketJobTest < ActiveSupport::TestCase
  def file(overrides = {})
    { "permalink" => "https://files.slack.com/board.png", "name" => "board.png" }.merge(overrides)
  end

  test "attachments are appended to the message text" do
    result = SupportTicketJob.text_with_attachments("my board wont boot", [ file ])

    assert_includes result, "my board wont boot"
    assert_includes result, "<https://files.slack.com/board.png|board.png>"
  end

  test "an image with no caption still produces usable text" do
    result = SupportTicketJob.text_with_attachments("", [ file ])

    assert_not result.blank?
    assert_includes result, "<https://files.slack.com/board.png|board.png>"
  end

  test "text is unchanged when there are no files" do
    assert_equal "just a question", SupportTicketJob.text_with_attachments("just a question", nil)
    assert_equal "just a question", SupportTicketJob.text_with_attachments("just a question", [])
  end

  test "files without a permalink are skipped" do
    result = SupportTicketJob.text_with_attachments("hello", [ file("permalink" => nil) ])

    assert_equal "hello", result
  end
end
