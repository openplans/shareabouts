namespace :cover_me do
  
  desc "Generates and opens code coverage report."
  task :report do
    require 'cover_me'
    do_coverage = ENV['coverage'].to_s.downcase.strip
    if do_coverage =~ /nobrowser/
      CoverMe.config do |c|
        # This should be possible to do in spec_helper.rb, but that
        # seems to be broken, see
        # https://github.com/markbates/cover_me/issues/15
        # So we'll do it here.
        c.at_exit = Proc.new {
          puts "Code coverage report created, but not opening browser"
        }
      end
      CoverMe.complete!
    elsif do_coverage =~ /^(0|n|no|none|false|f|off)$/
        puts "Code coverage disabled."
    else
      puts "Will display code coverage"
      CoverMe.complete!
    end
  end
end

task :test do
  Rake::Task['cover_me:report'].invoke
end

task :spec do
  Rake::Task['cover_me:report'].invoke
end

