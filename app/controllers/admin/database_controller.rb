class Admin::DatabaseController < Admin::ApplicationController
  before_action :require_admin!

  HIDDEN_TABLES = %w[audit_events versions].freeze

  def index
    tables = (ActiveRecord::Base.connection.tables - HIDDEN_TABLES).sort

    render inertia: "Admin/Database/Index", props: {
      tables: tables
    }
  end

  def query
    sql = params[:sql].to_s.strip

    if sql.blank?
      return render json: { error: "SQL query cannot be blank" }, status: :unprocessable_entity
    end

    if HIDDEN_TABLES.any? { |t| sql.match?(/\b#{Regexp.escape(t)}\b/i) }
      return render json: { error: "Queries against #{HIDDEN_TABLES.join(', ')} are not allowed here." }, status: :forbidden
    end

    begin
      result = nil

      ActiveRecord::Base.connection.transaction do
        ActiveRecord::Base.connection.execute("SET TRANSACTION READ ONLY")
        result = ActiveRecord::Base.connection.exec_query(sql)
      end

      audit!("database.queried", metadata: {
        sql: sql,
        row_count: result.rows.size,
        columns: result.columns,
        rows: result.rows.first(50),
        truncated: result.rows.size > 50
      })
      render json: {
        columns: result.columns,
        rows: result.rows,
        row_count: result.rows.size
      }
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end
end
