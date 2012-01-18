class ActivityController < ApplicationController

  def index
    respond_to do |format|
      format.json do
        where = if params[:after].present?
          ["id > ?", params[:after]]
        elsif params[:before].present?
          ["id < ?", params[:before]]
        else
          ""
        end
        
        @activity_items = ActivityItem.where(where)
          .limit(params[:limit])
          .order('created_at desc')
        render "index.html"
      end
    end
  end
end
