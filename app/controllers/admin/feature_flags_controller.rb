class Admin::FeatureFlagsController < Admin::ApplicationController
  before_action :require_feature_flags_permission!

  def index
    @flags = FeatureFlag.order(:name)

    render inertia: "Admin/FeatureFlags/Index", props: {
      flags: @flags.map { |f| serialize_flag(f) }
    }
  end

  def create
    flag = FeatureFlag.new(flag_params)

    if flag.save
      redirect_to admin_feature_flags_path, notice: "Flag '#{flag.name}' created."
    else
      redirect_to admin_feature_flags_path, alert: flag.errors.full_messages.join(", ")
    end
  end

  def toggle
    flag = FeatureFlag.find(params[:id])
    flag.update!(enabled: !flag.enabled)
    redirect_to admin_feature_flags_path, notice: "Flag '#{flag.name}' #{flag.enabled? ? 'enabled' : 'disabled'}."
  end

  def destroy
    flag = FeatureFlag.find(params[:id])
    flag.destroy
    redirect_to admin_feature_flags_path, notice: "Flag '#{flag.name}' deleted."
  end

  private

  def require_feature_flags_permission!
    require_permission!("feature_flags")
  end

  def flag_params
    params.expect(feature_flag: [ :name, :description, :enabled ])
  end

  def serialize_flag(flag)
    {
      id: flag.id,
      name: flag.name,
      description: flag.description,
      enabled: flag.enabled,
      updated_at: flag.updated_at.strftime("%b %d, %Y %H:%M")
    }
  end
end
