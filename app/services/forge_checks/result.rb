module ForgeChecks
  Result = Struct.new(:key, :name, :source, :verdict, :reasoning, keyword_init: true) do
    VALID_VERDICTS = %w[pass fail uncertain skipped].freeze

    def to_h
      {
        "name" => name,
        "source" => source,
        "verdict" => VALID_VERDICTS.include?(verdict.to_s) ? verdict.to_s : "uncertain",
        "reasoning" => reasoning.to_s
      }
    end
  end
end
