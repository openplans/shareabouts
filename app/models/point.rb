class Point < CartoModel
  
  # has_many :votes, :as => :supportable, :dependent => :destroy
  
  # merges top-level lat & lng into point object
  def self.new_from_params(params)
    if params[:point]
      params[:point][:lat] = params[:lat] if params[:lat] 
      params[:point][:lng] = params[:lng] if params[:lng] 
      new params[:point]
    else
      new params
    end
  end
  
  # temporary in leiu of activerecord
  def votes
    Vote.where :supportable_id => id, :supportable_type => self.class.to_s
  end
  
  def votes_count
    votes.count
  end
  
  def as_geo_json
    {
      :type => "Feature", 
      :geometry => {
        :type => "Point", 
        :coordinates => [lng, lat]
      },
      :properties => {
        :id             => cartodb_id,
        :name           => name,
        :description    => description
      }
    }
  end
  
  def self.table_name
    "shareabouts_production_points"
  end
end
