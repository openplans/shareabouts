class FeaturePointsController < ApplicationController

  before_filter :ignore_comments_fields_if_empty, :only => :create
  
  def index
    respond_to do |format|
      format.html
      format.json do
        render :json => geo_json_for(FeaturePoint.all )
      end
    end
  end
  
  def new
    @point = FeaturePoint.new

    respond_to do |format|
      format.json { render :json => { :view => render_to_string(:partial => "form.html") } }
    end
  end
  
  def create
    @point = FeaturePoint.new params[:feature_point].merge({:the_geom => the_geom_from_params(params)})
    
    if @point.save
      respond_to do |format|
        format.json do
          render :json => { :geoJSON => @point.as_geo_json } 
        end
      end
    else
      raise @point.errors.inspect
      # todo
    end
  end
  
  def show
    @point = FeaturePoint.find params[:id], :include => :comments
    respond_to do |format|
      format.json do
        render :json => { :view => render_to_string(:partial => "show.html", :locals => { :feature_point => @point }) } 
      end
    end
  end
  
  private
  
  def the_geom_from_params(p)
    Point.from_x_y p[:longitude].to_f, p[:latitude].to_f, 4326
  end
  
  def ignore_comments_fields_if_empty
    if params[:feature_point][:comments_attributes] && params[:feature_point][:comments_attributes]["0"][:comment].blank?
      params[:feature_point].delete(:comments_attributes)
    end
  end
  
end
