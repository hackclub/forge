require "test_helper"

class AiRequirementsCheckerTest < ActiveSupport::TestCase
  setup do
    @project = projects(:one)
  end

  def prompt(name:)
    AiRequirementsChecker.justification_prompt(
      text: "Approved 12h against 20h claimed; commits span Mar 1-14.",
      hours: 12,
      project: @project,
      name: name
    )
  end

  test "justification prompt omits the name standard when no name is given" do
    result = prompt(name: nil)
    assert_includes result, "4. Scope justified"
    assert_not_includes result, "Builder name usable"
    assert_includes result, "each of the 4 standards"
  end

  test "justification prompt audits the payload name when one is given" do
    result = prompt(name: { first: "Ada", last: "Lovelace" })
    assert_includes result, "5. Builder name usable"
    assert_includes result, "First Name in payload: Ada"
    assert_includes result, "Last Name in payload: Lovelace"
    assert_includes result, "each of the 5 standards"
  end

  test "justification prompt marks a blank name part as empty" do
    result = prompt(name: { first: "", last: "Lovelace" })
    assert_includes result, "First Name in payload: (empty)"
    assert_includes result, "Last Name in payload: Lovelace"
  end

  test "the name keys read from the payload are the ones the sync job writes" do
    @project.user.update!(first_name: "Grace", last_name: "Hopper")
    fields = AirtableSyncJob.build_fields(@project.reload)

    assert_equal "Grace", fields["First Name"]
    assert_equal "Hopper", fields["Last Name"]
  end
end
