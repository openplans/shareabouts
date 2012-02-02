# In deployed environments, we have a TAG and REVISION file in Rails.root. 
# REVISION is created by default by capistrano and contains the most recent
# git revision from which the release was created. 
# TAG is created in a custom post-deploy capistrano hook and contains the
# branch or tag from which the release was created.
# Together, they create a moment in history.
# If either does not exist, we use the current git state.

Rails.application.config.version = begin 
  tag      = File.read('TAG').strip
  revision = File.read('REVISION').strip
  "#{tag} #{revision}"
rescue Errno::ENOENT => e
  `git describe --tags --always --dirty`.chomp
end