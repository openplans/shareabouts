class CommentsController < ApplicationController
  before_filter :get_commentable, :only => :create
  
  def create
    @comment = @commentable.comments.create  params[:comment].merge(:user => current_user)    
    
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
