# Comments are polymorphic, so they can be applied to any model as long as the 
# other model specifies `has_many :comments, :as => :commentable`
# Currently comments are only implemented for FeaturePoints.

class Comment < ActiveRecord::Base
  belongs_to :commentable, :polymorphic => true, :inverse_of => :comments
  belongs_to :profile
  has_one    :user, :through => :profile
  has_many   :activity_items, :as => :subject, :inverse_of => :subject, :dependent => :destroy
  
  validates :commentable, :presence => true
  validates :comment, :presence => true
  
  def display_submitter
    profile.try(:name) || submitter_name
  end
end
