class CommentsController < ApplicationController
  before_filter :get_commentable, :find_or_create_profile, :only => :create
  
  def create
    @comment = @commentable.comments.create params[:comment].merge(:profile => @profile)    
    
    respond_to do |format|
      format.json { 
        render :json => {
          :comment => @comment.as_json, 
          :view => render_to_string(:partial => "#{commentable_class.tableize}/show.html", :locals => { commentable_class.underscore.to_sym => @commentable }) 
        }
      }
    end
  end
  
  private
  
  def get_commentable
    if params[:feature_point_id]
      @commentable = FeaturePoint.find params[:feature_point_id]
    end
  end
  
  def commentable_class
    @commentable.class.to_s
  end
end
