class DevlogValidator
  MIN_CONTENT_LENGTH = 100

  def self.valid_for_submission?(content)
    new(content).valid_for_submission?
  end

  def self.errors_for_submission(content)
    new(content).errors
  end

  def self.validation_details(content)
    new(content).validation_details
  end

  def initialize(content)
    @content = content.to_s
  end

  def valid_for_submission?
    errors.empty?
  end

  def errors
    @errors ||= compute_errors
  end

  def validation_details
    @validation_details ||= compute_validation_details
  end

  private

  def compute_validation_details
    {
      content_length: text_without_links.length,
      min_content_length: MIN_CONTENT_LENGTH,
      has_image: has_image?,
      meets_length_requirement: text_without_links.length >= MIN_CONTENT_LENGTH,
      meets_image_requirement: has_image?,
      meets_all_requirements: text_without_links.length >= MIN_CONTENT_LENGTH && has_image?
    }
  end

  def compute_errors
    errors = []
    errors << "Content must be at least #{MIN_CONTENT_LENGTH} characters" if content_too_short?
    errors << "Content must include at least one image" unless has_image?
    errors
  end

  def content_too_short?
    text_without_links.length < MIN_CONTENT_LENGTH
  end

  def has_image?
    # Check for markdown image syntax: ![alt](url)
    # Also check for HTML img tags
    (@content.include?("![") && @content.include?("](")) ||
      @content.include?("<img")
  end

  def text_without_links
    # Remove markdown links: [text](url) -> text
    text = @content.gsub(/\[([^\]]+)\]\([^\)]+\)/, '\1')
    # Remove HTML tags
    text = text.gsub(/<[^>]+>/, "")
    text
  end
end
