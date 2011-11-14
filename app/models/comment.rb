class Comment < ActiveRecord::Base
  belongs_to :commentable, :polymorphic => true
  
  validates :commentable, :presence => true
  validates :comment, :presence => true
end
