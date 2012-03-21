class Comment < ActiveRecord::Base
  belongs_to :commentable, :polymorphic => true, :inverse_of => :comments
  belongs_to :profile
  has_many   :activity_items, :as => :subject, :inverse_of => :subject, :dependent => :destroy
  
  validates :commentable, :presence => true
  validates :comment, :presence => true
  
  def display_submitter
    user.try(:name) || submitter_name
  end
  
  def user
    profile.user if profile.present?
  end
end
