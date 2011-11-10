class VotesController < ApplicationController
  
  before_filter :get_supportable, :only => :create
  
  def create
    # explicit supportable stuff due to lack of AR
    @vote = Vote.create params[:vote].merge( {:supportable_id => @supportable.id, :supportable_type => supportable_class } )
    
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
    if params[:point_id]
      @supportable = Point.find params[:point_id]
    end
  end
  
  def supportable_class
    @supportable.class.to_s
  end
end