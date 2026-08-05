module GuidesProps
  extend ActiveSupport::Concern

  GUIDE_SLUG_PATTERN = /\A[a-z0-9_-]+\z/i
  GUIDE_FILE_LINK_PATTERN = %r{\]\((?:\./)?files/([^)\s#?]+)\)}
  INLINE_FILE_EXTENSIONS = %w[c cfg conf cpp css csv gcode h hpp html ini ino js json jsx md py rb scad sh toml ts tsx txt xml yaml yml].freeze
  INLINE_FILE_LIMIT = 64.kilobytes
  IMAGE_EXTENSIONS = %w[gif jpeg jpg png svg webp].freeze

  private

  def guides_props(raw_slug)
    slug = raw_slug.to_s
    {
      list: guides_index,
      guide: slug.match?(GUIDE_SLUG_PATTERN) ? guide_detail(slug) : nil
    }
  end

  def guides_index
    base = Rails.root.join("guides")
    return [] unless File.directory?(base)

    Dir.children(base).filter_map { |name|
      path = base.join(name, "guide.md")
      next unless name.match?(GUIDE_SLUG_PATTERN) && File.exist?(path)

      meta = helpers.guide_metadata_for(path)
      next if meta[:unlisted]

      intro, sections = split_guide_sections(File.read(path))
      {
        slug: name,
        title: meta[:title].presence || humanized_guide_title(name),
        description: meta[:description],
        priority: meta[:priority].to_i,
        steps_count: sections.length + (intro.present? ? 1 : 0)
      }
    }.sort_by { |g| [ -g[:priority], g[:title].downcase ] }.map { |g| g.except(:priority) }
  end

  def guide_detail(slug)
    path = Rails.root.join("guides", slug, "guide.md")
    return nil unless File.exist?(path)

    return build_guide_detail(slug, path) if Rails.env.development?

    key = [ "guide_popup", slug, File.mtime(path).to_i ]
    Rails.cache.fetch(key) { build_guide_detail(slug, path) }
  end

  def build_guide_detail(slug, path)
    meta = helpers.guide_metadata_for(path)
    intro, sections = split_guide_sections(File.read(path))

    steps = []
    steps << guide_step("Overview", intro, slug) if intro.present?
    sections.each do |section|
      heading, _, body = section.partition("\n")
      title = heading.delete_prefix("## ").strip.gsub(/\A[*_]+|[*_]+\z/, "")
      steps << guide_step(title, body, slug)
    end

    {
      slug: slug,
      title: meta[:title].presence || humanized_guide_title(slug),
      description: meta[:description],
      steps: steps
    }
  end

  def guide_step(title, body, slug)
    rewritten = body.gsub(%r{\]\((?:\./)?files/}, "](/guides/#{slug}/files/")
    {
      title: title,
      content_html: helpers.render_markdown(rewritten),
      files: guide_step_files(body, slug)
    }
  end

  def guide_step_files(body, slug)
    base = Rails.root.join("guides", slug, "files")
    body.scan(GUIDE_FILE_LINK_PATTERN).flatten.uniq.filter_map do |rel|
      ext = File.extname(rel).delete_prefix(".").downcase
      next if IMAGE_EXTENSIONS.include?(ext)

      path = base.join(rel)
      next unless File.file?(path) && File.expand_path(path).start_with?("#{File.expand_path(base)}#{File::SEPARATOR}")

      inline = INLINE_FILE_EXTENSIONS.include?(ext) && File.size(path) <= INLINE_FILE_LIMIT
      {
        name: File.basename(rel),
        url: "/guides/#{slug}/files/#{rel}",
        language: ext.presence,
        size: File.size(path),
        content: inline ? File.read(path) : nil
      }
    end
  end

  def split_guide_sections(raw)
    content = helpers.strip_front_matter_table(raw)
    sections = content.split(/^(?=## )/)
    intro = sections.first&.start_with?("## ") ? nil : sections.shift
    [ intro.to_s.strip, sections ]
  end

  def humanized_guide_title(slug)
    slug.tr("-_", " ").split.map(&:capitalize).join(" ")
  end
end
