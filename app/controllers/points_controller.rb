class PointsController < ApplicationController

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
          render :json => { :view => render_to_string(:partial => "show.html", :locals => { :point => @point }) } 
        end
      end
    else
      # todo
    end
  end
  
end
