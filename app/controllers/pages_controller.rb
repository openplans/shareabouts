class PagesController < ApplicationController

  def show
    @page = Page.published.find_by_slug params[:id]
    respond_to do |format|
      format.html
      format.json { render :json => { :view => render_to_string(:partial => "show.html.erb") }}
    end
  end
end
