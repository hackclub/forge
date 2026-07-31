class Admin::ClaudeController < Admin::ApplicationController
  before_action :require_superadmin!

  def show
    render inertia: "Admin/Claude/Show", props: {
      credential_source: AiRequirementsChecker.credential_source,
      model: AiRequirementsChecker.model,
      token_saved_at: AppSetting.updated_at_for(AiRequirementsChecker::AUTH_TOKEN_SETTING)&.strftime("%b %d, %Y %H:%M")
    }
  end

  def update
    token = params[:token].to_s.strip
    return redirect_to admin_claude_path, alert: "Paste a token first." if token.blank?

    begin
      AiRequirementsChecker.test_connection!(token)
    rescue AiRequirementsChecker::Error => e
      return redirect_to admin_claude_path, alert: e.message
    end

    AppSetting.set(AiRequirementsChecker::AUTH_TOKEN_SETTING, token)
    audit!("claude.reauthed", metadata: { token_digest: Digest::SHA256.hexdigest(token).first(12) })
    redirect_to admin_claude_path, notice: "Claude reauthed — token verified and saved."
  end

  def test
    AiRequirementsChecker.test_connection!
    redirect_to admin_claude_path, notice: "Claude connection is working."
  rescue AiRequirementsChecker::Error => e
    redirect_to admin_claude_path, alert: e.message
  end

  def destroy
    AppSetting.clear(AiRequirementsChecker::AUTH_TOKEN_SETTING)
    audit!("claude.token_cleared")
    redirect_to admin_claude_path, notice: "Saved Claude token cleared."
  end

  private

  def require_superadmin!
    require_permission!("superadmin")
  end
end
