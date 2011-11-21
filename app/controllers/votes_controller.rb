class VotesController < ApplicationController
  
  before_filter :get_supportable, :only => :create
  
  def create
    @vote = @supportable.votes.create :user => current_user
    
    respond_to do |format|
      format.json { 
        render :json => {
          :vote => @vote.as_json, 
          :view => render_to_string(:partial => "#{supportable_class.tableize}/show.html", :locals => { supportable_class.underscore.to_sym => @supportable }) 
        }
      }
    end
  end
  
  private
  
  def get_supportable
    if params[:feature_point_id]
      @supportable = FeaturePoint.find params[:feature_point_id]
    end
  end
  
  def supportable_class
    @supportable.class.to_s
  end
end