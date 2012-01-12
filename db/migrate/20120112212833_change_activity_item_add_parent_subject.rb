class ChangeActivityItemAddParentSubject < ActiveRecord::Migration
  def up
    add_column :activity_items, :subject_parent_id, :integer
    add_column :activity_items, :subject_parent_type, :string
    
    update_items!
  end

  def down
    remove_column :activity_items, :subject_parent_id
    remove_column :activity_items, :subject_parent_type
  end
  
  private
  
  def update_items!
    ActivityItem.find_each do |item|
      if item.subject.respond_to?(:commentable)
        item.update_attribute :subject_parent, item.subject.commentable
      elsif item.subject.respond_to?(:supportable)
        item.update_attribute :subject_parent, item.subject.supportable
      end
    end
  end
end
