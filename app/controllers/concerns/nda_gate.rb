module NdaGate
  extend ActiveSupport::Concern

  private

  def nda_cleared?
    current_user&.nda_bypass? || nda_signed?
  end

  def nda_signed?
    return @nda_signed if defined?(@nda_signed)

    @nda_signed = current_user.present? && NdaService.status(current_user.slack_id)[:status] == "signed"
  end
end
