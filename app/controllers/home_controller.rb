class HomeController < ApplicationController
  def index
    projects = current_user.projects.kept.order(updated_at: :desc).to_a
    news_posts = NewsPost.includes(:author).published.limit(3)
    staff_picks = Project.kept.where(hidden: false).includes(:user).staff_picks.limit(3)
    approved_count = Project.kept.where(status: %i[approved pending pitch_approved pitch_pending]).count

    render inertia: "Home/Index", props: {
      user: {
        display_name: current_user.display_name,
        email: current_user.email,
        avatar: current_user.avatar,
        created_at: current_user.created_at.strftime("%B %d, %Y")
      },
      stats: {
        projects_count: projects.size
      },
      orph_motivation: {
        approved_count: approved_count,
        goal: 100,
        dino_image: random_orph_dino
      },
      projects: projects.map { |p|
        {
          id: p.id,
          name: p.name,
          subtitle: p.subtitle,
          status: p.status,
          cover_image_url: p.cover_image_url,
          updated_at: p.updated_at.strftime("%b %d, %Y")
        }
      },
      news_posts: news_posts.map { |post|
        {
          id: post.id,
          title: post.title,
          body_html: helpers.render_markdown(post.body),
          published_at: post.published_at.strftime("%b %d, %Y"),
          author_name: post.author.display_name
        }
      },
      staff_picks: staff_picks.map { |p|
        {
          id: p.id,
          name: p.name,
          subtitle: p.subtitle,
          cover_image_url: p.cover_image_url,
          user_id: p.user_id,
          user_display_name: p.user.display_name,
          user_avatar: p.user.avatar
        }
      }
    }
  end

  private

  def random_orph_dino
    dir = Rails.public_path.join("dino_images/orph_motivation")
    images = Dir.glob(dir.join("*.{png,jpg,jpeg,gif,webp}")).map { |p| File.basename(p) }
    return "/dino_images/dinosaur_sweating_bullets.png" if images.empty?

    "/dino_images/orph_motivation/#{images.sample}"
  end
end
