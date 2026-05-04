class Reels::CommentsController < ApplicationController
  before_action :require_reels_enabled!
  before_action :set_reel

  def index
    authorize ReelComment, :index?
    comments = @reel.reel_comments.recent.includes(:user).limit(200)
    render json: { comments: comments.map { |c| serialize(c) } }
  end

  def create
    comment = @reel.reel_comments.build(user: current_user, body: params[:body])
    authorize comment

    if comment.save
      render json: { comment: serialize(comment) }, status: :created
    else
      render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    comment = @reel.reel_comments.find(params[:id])
    authorize comment
    comment.destroy
    head :no_content
  end

  private

  def set_reel
    @reel = Reel.find(params[:reel_id])
  end

  def serialize(comment)
    {
      id: comment.id,
      body: comment.body,
      created_at: comment.created_at.iso8601,
      can_destroy: ReelCommentPolicy.new(current_user, comment).destroy?,
      user: {
        id: comment.user_id,
        display_name: comment.user.display_name,
        avatar: comment.user.avatar
      }
    }
  end
end
