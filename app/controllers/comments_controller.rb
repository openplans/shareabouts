class CommentsController < ApplicationController
  before_filter :get_commentable, :only => :create
  
  def create
    # explicit commentable stuff due to lack of AR
    @vote = Comment.create params[:comment].merge( {:commentable_id => @commentable.id, :commentable_type => commentable_class } )
    
    respond_to do |format|
      format.json { 
        render :json => {
          :vote => @vote.as_json, 
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
