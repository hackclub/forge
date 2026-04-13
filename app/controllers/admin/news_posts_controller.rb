class Admin::NewsPostsController < Admin::ApplicationController
  before_action :require_news_permission!

  def index
    posts = NewsPost.includes(:author).order(created_at: :desc)

    render inertia: "Admin/NewsPosts/Index", props: {
      posts: posts.map { |p| serialize_post(p) }
    }
  end

  def create
    post = NewsPost.new(post_params.merge(author: current_user))

    if post.save
      audit!("news_post.created", target: post, metadata: { title: post.title, published: post.published })
      redirect_to admin_news_posts_path, notice: "News post created."
    else
      redirect_to admin_news_posts_path, alert: post.errors.full_messages.join(", ")
    end
  end

  def update
    post = NewsPost.find(params[:id])

    if post.update(post_params)
      audit!("news_post.updated", target: post, metadata: { title: post.title, published: post.published, changes: audit_changes_for(post) })
      redirect_to admin_news_posts_path, notice: "News post updated."
    else
      redirect_to admin_news_posts_path, alert: post.errors.full_messages.join(", ")
    end
  end

  def toggle
    post = NewsPost.find(params[:id])
    post.update!(published: !post.published)
    audit!("news_post.publish_toggled", target: post, metadata: { title: post.title, published: post.published })
    redirect_to admin_news_posts_path, notice: "News post #{post.published? ? 'published' : 'unpublished'}."
  end

  def destroy
    post = NewsPost.find(params[:id])
    audit!("news_post.destroyed", target: post, label: post.title, metadata: { title: post.title })
    post.destroy
    redirect_to admin_news_posts_path, notice: "News post deleted."
  end

  private

  def require_news_permission!
    require_permission!("news")
  end

  def post_params
    params.expect(news_post: [ :title, :body, :published ])
  end

  def serialize_post(post)
    {
      id: post.id,
      title: post.title,
      body: post.body,
      published: post.published,
      published_at: post.published_at&.strftime("%b %d, %Y %H:%M"),
      author_name: post.author.display_name,
      updated_at: post.updated_at.strftime("%b %d, %Y %H:%M")
    }
  end
end
