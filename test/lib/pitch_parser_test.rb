require "test_helper"

class PitchParserTest < ActiveSupport::TestCase
  def extract(content)
    PitchParser.extract_json_object(content)
  end

  test "extracts plain json" do
    assert_equal %({"name":"X"}), extract(%({"name":"X"}))
  end

  test "ignores reasoning <think> blocks and code fences" do
    content = "<think>maybe {a:1}</think>\n```json\n{\"name\":\"Da Coil\"}\n```"
    assert_equal %({"name":"Da Coil"}), extract(content)
  end

  test "is not fooled by braces inside string values" do
    json = %({"name":"Coil {v2}","summary":"uses {IGBT}"})
    assert_equal json, extract(json)
  end

  test "returns the full balanced object when nested" do
    json = %({"name":"X","meta":{"a":1},"tags":[]})
    assert_equal json, extract(json)
  end

  test "pulls json out of surrounding prose" do
    assert_equal %({"name":"Y"}), extract("Here you go:\n{\"name\":\"Y\"} hope it helps")
  end

  test "returns nil when the object is truncated" do
    # A long pitch echoed in cleaned_pitch can blow the token cap mid-string;
    # we must not hand back an unbalanced span.
    assert_nil extract(%({"name":"Da Coil","cleaned_pitch":"a very long pitch that got cut))
  end

  test "returns nil when there is no object at all" do
    assert_nil extract("the model refused and wrote only prose")
  end

  test "fallback has the full field shape" do
    fb = PitchParser.fallback("raw text")
    assert_equal %i[name cleaned_pitch admin_summary tags green_flags red_flags].sort, fb.keys.sort
    assert_equal "raw text", fb[:cleaned_pitch]
    assert_empty fb[:red_flags]
  end
end
