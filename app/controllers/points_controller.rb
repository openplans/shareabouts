class PointsController < ApplicationController

  def index
    respond_to do |format|
      format.html
      format.json do
        render :json => geo_json_for( Point.all )
      end
    end
  end
  
  def new
    @point = Point.new

    respond_to do |format|
      format.json { render :json => { :view => render_to_string(:partial => "form.html") } }
    end
  end
  
  def create
    @point = Point.new_from_params params
    
    if @point.save
      respond_to do |format|
        format.json do
          render :json => { :geoJSON => @point.as_geo_json } 
        end
      end
    else
      # todo
    end
  end
  
  def show
    @point = Point.find params[:id]
    respond_to do |format|
      format.json do
        render :json => { :view => render_to_string(:partial => "show.html", :locals => { :point => @point }) } 
      end
    end
  end
  
end
