require "redcarpet"
require "uri"
require "digest"

module MarkdownHelper
  def self.canonical_base_url
    host = ENV["APPLICATION_HOST"]
    host.present? ? "https://#{host}" : nil
  end

  class GuidesLinkRenderer < Redcarpet::Render::HTML
    def initialize(options = {})
      @base_url = options[:base_url]
      super
    end

    def link(href, title, content)
      href = href.to_s
      attrs = []
      attrs << %(href="#{ERB::Util.html_escape(href)}")
      attrs << %(title="#{ERB::Util.html_escape(title)}") if title

      if !guide_internal_link?(href) && !same_origin?(href)
        attrs << %(target="_blank")
        attrs << %(rel="nofollow noopener")
      end

      "<a #{attrs.join(' ')}>#{content}</a>"
    end

    def guide_internal_link?(href)
      return false if href.start_with?("#")
      return true  if href.start_with?("./", "../")
      if href.start_with?("/")
        return href.start_with?("/docs")
      end
      return false if href =~ /\A[a-z][a-z0-9+.-]*:/i
      true
    end

    private

    def same_origin?(href)
      return true if href.start_with?("/", "#", "./", "../")
      return false unless href =~ /\Ahttps?:\/\//i
      return false unless @base_url

      begin
        base = URI.parse(@base_url)
        u = URI.parse(href)
        base.scheme == u.scheme && base.host == u.host && (base.port || default_port(base.scheme)) == (u.port || default_port(u.scheme))
      rescue URI::InvalidURIError
        false
      end
    end

    def default_port(scheme)
      scheme.to_s.downcase == "https" ? 443 : 80
    end
  end

  def render_markdown(text, base_url: nil)
    base_url ||= MarkdownHelper.canonical_base_url || (request.base_url rescue nil)

    if defined?(@__markdown_renderer_base_url).nil? || @__markdown_renderer_base_url != base_url || @__markdown_renderer.nil?
      renderer = GuidesLinkRenderer.new(
        with_toc_data: true,
        hard_wrap: true,
        filter_html: false,
        prettify: true,
        base_url: base_url
      )
      @__markdown_renderer = Redcarpet::Markdown.new(
        renderer,
        autolink: true,
        tables: true,
        fenced_code_blocks: true,
        strikethrough: true,
        lax_spacing: true,
        space_after_headers: true,
        footnotes: true
      )
      @__markdown_renderer_base_url = base_url
    end

    processed = preprocess_checkboxes(text)
    processed = preprocess_callouts(processed, @__markdown_renderer)
    @__markdown_renderer.render(processed).html_safe
  end

  def preprocess_checkboxes(text)
    text.gsub(/^- \[ \] /m, '<input type="checkbox" disabled> ').gsub(/^- \[x\] /im, '<input type="checkbox" checked disabled> ')
  end

  def preprocess_callouts(text, renderer)
    return text unless text.include?("<aside")

    text.gsub(%r{<aside(\s[^>]*)?>\s*(.*?)\s*</aside>}m) do
      attrs = Regexp.last_match(1).to_s
      inner_md = Regexp.last_match(2)
      inner_html = renderer.render(inner_md)
      "<aside#{attrs}>#{inner_html}</aside>"
    end
  end

  def render_markdown_file(path, base_url: nil)
    base_url ||= MarkdownHelper.canonical_base_url || (request.base_url rescue nil)
    raw = File.read(path)
    cleaned = strip_front_matter_table(raw)

    return render_markdown(cleaned, base_url: base_url) if Rails.env.development?

    key = [ "guide_md_html", path.to_s, File.mtime(path).to_i, base_url ]
    Rails.cache.fetch(key) { render_markdown(cleaned, base_url: base_url) }
  end

  def docs_metadata(base:, url_prefix:, default_index_title: "")
    paths = Dir.glob(base.join("**/*.md").to_s)
    stats = paths.map { |p| [ p, File.mtime(p).to_i ] }.sort_by(&:first)
    return build_docs_metadata(base, url_prefix, default_index_title, paths) if Rails.env.development?

    stats_digest = Digest::SHA256.hexdigest(stats.flatten.join("|"))
    Rails.cache.fetch([ "docs_metadata", base.to_s, url_prefix, default_index_title, stats_digest ]) do
      build_docs_metadata(base, url_prefix, default_index_title, paths)
    end
  end

  def build_docs_metadata(base, url_prefix, default_index_title, paths)
    items = []
    paths.each do |p|
      rel = Pathname.new(p).relative_path_from(base).to_s

      slug = nil
      url  = nil
      if rel == "index.md"
        slug = ""
        url  = url_prefix
      else
        s = rel.sub(/\.md\z/, "")
        if File.basename(s) == "index"
          dir = File.dirname(s)
          slug = (dir == "." ? "" : dir)
        else
          slug = s
        end
        url = slug.blank? ? url_prefix : "#{url_prefix}/#{slug}"
      end

      meta = parse_guide_metadata(p)
      fallback_title = if slug.blank?
        default_index_title
      else
        slug.tr("-_/", " ").split.map(&:capitalize).join(" ")
      end
      title = meta[:title].presence || fallback_title
      desc  = meta[:description].presence
      prio  = meta[:priority]
      unlisted = meta[:unlisted] || false
      items << { title: title, path: url, description: desc, slug: slug, file: p, priority: prio, unlisted: unlisted }
    end
    items
  end

  def docs_section_metadata
    base = Rails.root.join("docs")
    docs_metadata(base: base, url_prefix: "/docs", default_index_title: "Docs")
  end

  def docs_menu_items
    docs_section_metadata
      .reject { |i| i[:slug].blank? || i[:unlisted] }
      .sort_by { |h| [ h[:priority].nil? ? Float::INFINITY : h[:priority].to_i, h[:title].downcase ] }
      .map { |i| { title: i[:title], path: i[:path], description: i[:description] } }
  end

  def docs_meta_for_url(url)
    docs_section_metadata.find { |i| i[:path] == url }
  end

  def docs_sidebar_tree
    base = Rails.root.join("docs")
    build_docs_sidebar_nodes(base, "")
  end

  def guide_metadata_for(path)
    parse_guide_metadata(path)
  end

  def menu_items_for(url_path)
    section = url_path.to_s.sub(%r{^/}, "")
    base = Rails.root.join("docs", section)
    return [] unless File.directory?(base)

    docs_metadata(base: base, url_prefix: url_path, default_index_title: section.titleize)
      .reject { |i| i[:slug].blank? || i[:unlisted] }
      .sort_by { |h| [ h[:priority].nil? ? Float::INFINITY : h[:priority].to_i, h[:title].downcase ] }
      .map { |i| { title: i[:title], path: i[:path], description: i[:description] } }
  end

  def meta_for_url(url_path, url)
    section = url_path.to_s.sub(%r{^/}, "")
    base = Rails.root.join("docs", section)
    return nil unless File.directory?(base)

    docs_metadata(base: base, url_prefix: url_path, default_index_title: section.titleize)
      .find { |i| i[:path] == url }
  end

  private

  def build_docs_sidebar_nodes(base, rel_dir)
    dir = rel_dir.blank? ? base : base.join(rel_dir)
    entries = Dir.children(dir).sort_by(&:downcase)

    folders = entries.select { |name| File.directory?(dir.join(name)) }
    files = entries.select { |name| name.end_with?(".md") }

    folder_nodes = folders.map do |folder_name|
      child_rel_dir = rel_dir.blank? ? folder_name : File.join(rel_dir, folder_name)
      child_nodes = build_docs_sidebar_nodes(base, child_rel_dir)
      folder_index_path = dir.join(folder_name, "index.md")
      folder_meta_title = File.exist?(folder_index_path) ? parse_guide_metadata(folder_index_path)[:title].presence : nil

      {
        type: "folder",
        title: folder_meta_title || humanize_sidebar_name(folder_name),
        path: docs_path_for_sidebar(child_rel_dir),
        children: child_nodes
      }
    end

    visible_files = files.reject { |file_name| rel_dir.present? && File.basename(file_name, ".md") == "index" }

    sorted_files = visible_files.sort_by do |file_name|
      [ File.basename(file_name, ".md") == "index" ? 0 : 1, file_name.downcase ]
    end

    page_nodes = sorted_files.map do |file_name|
      file_rel_path = rel_dir.blank? ? file_name : File.join(rel_dir, file_name)
      file_path = dir.join(file_name)
      meta_title = parse_guide_metadata(file_path)[:title].presence
      {
        type: "page",
        title: meta_title || humanize_sidebar_name(File.basename(file_name, ".md")),
        path: docs_path_for_sidebar(file_rel_path)
      }
    end

    rel_dir.blank? ? (page_nodes + folder_nodes) : (folder_nodes + page_nodes)
  end

  def docs_path_for_sidebar(rel_path)
    slug = rel_path.to_s.sub(/\.md\z/, "")
    slug = slug.sub(%r{/index\z}, "")
    slug = "" if slug == "index"
    slug.blank? ? "/docs" : "/docs/#{slug}"
  end

  def humanize_sidebar_name(name)
    name.to_s.tr("-_", " ").split.map(&:capitalize).join(" ")
  end

  def strip_front_matter_table(text)
    lines = text.lines
    i = 0
    i += 1 while i < lines.length && lines[i].strip.empty?
    return text unless i < lines.length && lines[i].lstrip.start_with?("|")
    j = i
    while j < lines.length
      line = lines[j]
      break unless line.lstrip.start_with?("|") || line.strip.empty?
      j += 1
    end
    (lines[j..] || []).join.lstrip
  end

  def parse_guide_metadata(path)
    return build_guide_metadata(path) if Rails.env.development?

    key = [ "guide_md_meta", path.to_s, File.mtime(path).to_i ]
    Rails.cache.fetch(key) { build_guide_metadata(path) }
  end

  def build_guide_metadata(path)
    meta = { title: nil, description: nil, priority: nil, unlisted: false }
    in_table = false
    File.foreach(path) do |raw|
      line = raw.rstrip
      break if in_table && !(line.start_with?("|") || line.strip.empty?)
      next if !in_table && line.strip.empty?

      if line.start_with?("|")
        in_table = true
        cells = line.split("|")
        cells.shift if cells.first&.strip == ""
        cells.pop   if cells.last&.strip == ""
        cells = cells.map { |c| c.strip }

        next if cells.all? { |c| c.match?(/\A:?-{3,}:?\z/) }

        if cells.length >= 2
          key = cells[0].to_s.downcase
          val = cells[1].to_s
          case key
          when "title", "description"
            meta[key.to_sym] = val
          when "priority"
            meta[:priority] = Integer(val) rescue nil
          when "unlisted"
            meta[:unlisted] = val.to_s.downcase == "true"
          end
        end
      else
        break
      end
    end
    meta
  rescue Errno::ENOENT
    { title: nil, description: nil, priority: nil, unlisted: false }
  end
end
