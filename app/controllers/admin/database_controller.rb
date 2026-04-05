class Admin::DatabaseController < Admin::ApplicationController
  before_action :require_admin!

  def index
    tables = ActiveRecord::Base.connection.tables.sort

    render inertia: "Admin/Database/Index", props: {
      tables: tables
    }
  end

  def query
    sql = params[:sql].to_s.strip

    if sql.blank?
      return render json: { error: "SQL query cannot be blank" }, status: :unprocessable_entity
    end

    begin
      result = ActiveRecord::Base.connection.exec_query(sql)
      render json: {
        columns: result.columns,
        rows: result.rows,
        row_count: result.rows.size
      }
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def execute
    sql = params[:sql].to_s.strip

    if sql.blank?
      return render json: { error: "SQL statement cannot be blank" }, status: :unprocessable_entity
    end

    begin
      result = ActiveRecord::Base.connection.execute(sql)
      render json: { message: "Executed successfully", affected_rows: result.cmd_tuples }
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end
end
