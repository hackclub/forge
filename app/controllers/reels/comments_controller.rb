class Reels::CommentsController < ApplicationController
  before_action :require_reels_enabled!
  before_action :set_reel

  def index
    authorize ReelComment, :index?
    top_level = @reel.reel_comments.top_level.recent.includes(:user, replies: :user).limit(200)
    render json: { comments: top_level.map { |c| serialize(c, include_replies: true) } }
  end

  def create
    parent = @reel.reel_comments.find_by(id: params[:parent_id]) if params[:parent_id].present?
    comment = @reel.reel_comments.build(user: current_user, body: params[:body], parent: parent)
    authorize comment

    if comment.save
      render json: { comment: serialize(comment, include_replies: false) }, status: :created
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

  def serialize(comment, include_replies:)
    payload = {
      id: comment.id,
      body: comment.body,
      parent_id: comment.parent_id,
      created_at: comment.created_at.iso8601,
      can_destroy: ReelCommentPolicy.new(current_user, comment).destroy?,
      user: {
        id: comment.user_id,
        display_name: comment.user.display_name,
        avatar: comment.user.avatar
      }
    }
    payload[:replies] = comment.replies.order(:created_at).map { |r| serialize(r, include_replies: false) } if include_replies
    payload
  end
end
