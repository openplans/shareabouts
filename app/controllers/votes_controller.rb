class VotesController < ApplicationController
  
  before_filter :get_supportable, :only => :create
  
  def create
    # explicit supportable stuff due to lack of AR
    @vote = Vote.create params[:vote].merge( {:supportable_id => @supportable.id, :supportable_type => @supportable.class.to_s } )
    
    respond_to do |format|
      format.js { render :json => {:vote => { :id => @vote.id }}}
    end
  end
  
  private
  
  def get_supportable
    if params[:point_id]
      @supportable = Point.find params[:point_id]
    end
  end
end