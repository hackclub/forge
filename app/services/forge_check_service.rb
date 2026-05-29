module ForgeCheckService
  module_function

  class Error < StandardError; end

  CHECKS = [
    ForgeChecks::RepoLinked,
    ForgeChecks::HasSubtitle,
    ForgeChecks::HasCoverImage,
    ForgeChecks::ReadmeExists,
    ForgeChecks::ReadmeDescribesProject,
    ForgeChecks::ReadmeHasImages,
    ForgeChecks::ReadmeHasBomTable,
    ForgeChecks::BomCsvInRepo,
    ForgeChecks::HasHardwareDesignFiles,
    ForgeChecks::HasFirmwareFiles,
    ForgeChecks::HasJournalEntries,
    ForgeChecks::JournalEntriesMeetLength,
    ForgeChecks::JournalEntriesHaveImages,
    ForgeChecks::JournalEntriesHaveTime,
    ForgeChecks::TotalHoursLogged,
    ForgeChecks::AiOriginalityCheck
  ].freeze

  def run(project)
    ctx = ForgeChecks::Context.new(project)
    results = CHECKS.map { |klass| safe_call(klass, ctx) }.compact
    visible = results.reject { |r| r.verdict.to_s == "skipped" }

    {
      "summary" => build_summary(visible),
      "overall" => overall_verdict(visible),
      "requirements" => visible.map(&:to_h),
      "checked_at" => Time.current.iso8601,
      "engine" => "forge_checks"
    }
  end

  def safe_call(klass, ctx)
    klass.call(ctx)
  rescue StandardError => e
    Rails.logger.error("ForgeCheck #{klass.name} crashed: #{e.class}: #{e.message}")
    ForgeChecks::Result.new(
      key: klass.respond_to?(:key) ? klass.key : klass.name.demodulize.underscore,
      name: klass.respond_to?(:label) ? klass.label : klass.name.demodulize,
      source: klass.respond_to?(:source) ? klass.source : "",
      verdict: "uncertain",
      reasoning: "Check crashed — skipped."
    )
  end

  def overall_verdict(results)
    verdicts = results.map { |r| r.verdict.to_s }
    return "fail" if verdicts.include?("fail")
    return "uncertain" if verdicts.include?("uncertain")
    "pass"
  end

  def build_summary(results)
    fails = results.select { |r| r.verdict.to_s == "fail" }
    uncertains = results.select { |r| r.verdict.to_s == "uncertain" }
    passes = results.count { |r| r.verdict.to_s == "pass" }

    if fails.any?
      top = fails.first(3).map(&:name).join(", ")
      "#{fails.size} thing#{'s' if fails.size != 1} to fix before you submit — start with: #{top}."
    elsif uncertains.any?
      "Looks promising — #{passes} clear pass#{'es' if passes != 1}, but #{uncertains.size} item#{'s' if uncertains.size != 1} worth a once-over yourself."
    else
      "Looks great! All #{passes} checks passed."
    end
  end
end
