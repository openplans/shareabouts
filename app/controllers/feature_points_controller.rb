class FeaturePointsController < ApplicationController

  before_filter :ignore_comments_fields_if_empty, :only => :create
  before_filter :set_cache_buster, :only => :show # for IE8
  
  def index
    respond_to do |format|
      format.html
      format.json do
        @feature_points = params[:bounds].present? ? 
          FeaturePoint.visible_within(params[:bounds].map {|p| p.split(",").map &:to_f }) : 
          FeaturePoint.visible
        render :json => geo_json_for( @feature_points )
      end
    end
  end
  
  def new
    @feature_point = FeaturePoint.new

    respond_to do |format|
      format.json { render :json => { :view => render_to_string(:partial => "form.html") } }
    end
  end
  
  def create
    @feature_point = FeaturePoint.new params[:feature_point].merge({:the_geom => the_geom_from_params(params), :user_id => current_user.try(:id)})
    
    if @feature_point.save
      respond_to do |format|
        format.json do
          render :json => { :geoJSON => @feature_point.as_geo_json, :status => "success" } 
        end
      end
    else
      respond_to do |format|
        format.json do
          render :json => { :status => "error", :view => render_to_string(:partial => "form.html.erb") } 
        end
      end
    end
  end
  
  def update
    @feature_point = FeaturePoint.find params[:id]
    authorize! :update, @feature_point
    
    @feature_point.update_attributes params[:feature_point]

    respond_to do |format|
      format.json do
        render :json => { :status => "error", :view => render_to_string(:partial => "show.html.erb", :locals => { :feature_point => @feature_point }) } 
      end
    end
  end
  
  def show
    @feature_point = FeaturePoint.find params[:id], :include => :comments
    respond_to do |format|
      format.html do
        render :action => 'index'
      end
      format.json do
        render :json => { :view => render_to_string(:partial => "show.html", :locals => { :feature_point => @feature_point }) } 
      end
    end
  end
  
  def within_region
    @feature_point = FeaturePoint.new :the_geom => the_geom_from_params(params)
        
    if !@feature_point.valid? && @feature_point.errors[:the_geom].present?
      respond_to do |format|
        format.json { render :json => { :status => "error", :message => @feature_point.errors[:the_geom].join(". ") } }
      end
    else
      respond_to do |format|
        format.json { render :json => { :status => "ok" } }
      end
    end
  end
  
  private
  
  def the_geom_from_params(p)
    Point.from_x_y p[:longitude].to_f, p[:latitude].to_f, 4326
  end
  
  def ignore_comments_fields_if_empty
    if params[:feature_point] && params[:feature_point][:comments_attributes] && params[:feature_point][:comments_attributes]["0"][:comment].blank?
      params[:feature_point].delete(:comments_attributes)
    end
  end
  
end
