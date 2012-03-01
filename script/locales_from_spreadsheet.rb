#!/usr/bin/env ruby

# Update locales/en.yml from our spreadsheet, saved as a local CSV

require 'yaml'
require 'csv'

# Needed a recursive hash merge; copied this one from github.
# Apparently Rails 3.2 has this built-in.
#
# = Hash Recursive Merge
#
# Merges a Ruby Hash recursively, Also known as deep merge.
# Recursive version of Hash#merge and Hash#merge!.
#
# Category:: Ruby
# Package:: Hash
# Author:: Simone Carletti <weppos@weppos.net>
# Copyright:: 2007-2008 The Authors
# License:: MIT License
# Link:: http://www.simonecarletti.com/
# Source:: http://gist.github.com/gists/6391/
#
module HashRecursiveMerge

  #
  # Recursive version of Hash#merge!
  #
  # Adds the contents of +other_hash+ to +hsh+,
  # merging entries in +hsh+ with duplicate keys with those from +other_hash+.
  #
  # Compared with Hash#merge!, this method supports nested hashes.
  # When both +hsh+ and +other_hash+ contains an entry with the same key,
  # it merges and returns the values from both arrays.
  #
  # h1 = {"a" => 100, "b" => 200, "c" => {"c1" => 12, "c2" => 14}}
  # h2 = {"b" => 254, "c" => {"c1" => 16, "c3" => 94}}
  # h1.rmerge!(h2) #=> {"a" => 100, "b" => 254, "c" => {"c1" => 16, "c2" => 14, "c3" => 94}}
  #
  # Simply using Hash#merge! would return
  #
  # h1.merge!(h2) #=> {"a" => 100, "b" = >254, "c" => {"c1" => 16, "c3" => 94}}
  #
  def rmerge!(other_hash)
    merge!(other_hash) do |key, oldval, newval|
      oldval.class == self.class ? oldval.rmerge!(newval) : newval
    end
  end

  #
  # Recursive version of Hash#merge
  #
  # Compared with Hash#merge!, this method supports nested hashes.
  # When both +hsh+ and +other_hash+ contains an entry with the same key,
  # it merges and returns the values from both arrays.
  #
  # Compared with Hash#merge, this method provides a different approch
  # for merging nasted hashes.
  # If the value of a given key is an Hash and both +other_hash+ abd +hsh
  # includes the same key, the value is merged instead replaced with
  # +other_hash+ value.
  #
  # h1 = {"a" => 100, "b" => 200, "c" => {"c1" => 12, "c2" => 14}}
  # h2 = {"b" => 254, "c" => {"c1" => 16, "c3" => 94}}
  # h1.rmerge(h2) #=> {"a" => 100, "b" => 254, "c" => {"c1" => 16, "c2" => 14, "c3" => 94}}
  #
  # Simply using Hash#merge would return
  #
  # h1.merge(h2) #=> {"a" => 100, "b" = >254, "c" => {"c1" => 16, "c3" => 94}}
  #
  def rmerge(other_hash)
    r = {}
    merge(other_hash) do |key, oldval, newval|
      r[key] = oldval.class == self.class ? oldval.rmerge(newval) : newval
    end
  end

end

class Hash
  include HashRecursiveMerge
end


class UpdateLocale

  def parse(path)
    rows = CSV.read(path)
    headers = rows[0]
    ## puts "headers:"
    ## p headers
    output = {}
    if rows.size < 2
      puts "Need at least 2 rows in your spreadsheet"
      exit 1
    end
    rows[1,(rows.size-1)].each do |row|
      if row.size < 3
        next
      end
      if row[0] == nil
        next
      end
      # 1st column contains colon-separated keys.
      keys = row[0].strip.split(':').collect{|key| key.strip}
      current_hash = output
      if not keys
        next
      end
      if keys.size > 1
        # puts "Current keys:"
        # p keys
        # puts "==============================="
        blargh = keys.size - 1
        blargh.times do |i|  #(keys.size - 1).times do |i|
          key = keys[i]
          if not key
            break
          end
          #puts "#{i} key is #{key}"
          if (not current_hash.has_key?(key)) or not current_hash[key]
            # puts "Making new hash at #{key}"
            current_hash[key] = {}
          # else
          #   puts "We have somethign in #{current_hash} at #{key}"
          end
          current_hash = current_hash[key]
        end
      end
      ## orig_val = row[1]
      ## unused label = row[2]
      if row.size > 2
        new_value = row[3] or ''
        if new_value
          # Assume that "[foo]" means "%{foo}"
          begin
            new_value = new_value.gsub(/\[/, '%{')
            new_value = new_value.gsub(/\]/, '}')
            current_hash[keys.last] = new_value
         rescue
            puts "threw an error!", new_value
         end
        end
      end
    end
    return output
  end

  def read_locales(path)
    translations = YAML::load(File.open(path, 'r'))
    translations
  end

  def main()
    old_translations = read_locales("config/locales/en.yml")
    new_en_translations = parse("/home/pw/Desktop/B10566 CB7 Sidewalk Clutter Map - interface text.csv")
    merged = Hash[old_translations]
    # Here's the recursive merge
    merged['en'] = old_translations['en'].rmerge(new_en_translations)
    puts '# Sample localization file for English. Add more files in this directory for other locales.'
    puts '# See https://github.com/svenfuchs/rails-i18n/tree/master/rails%2Flocale for starting points.'
    puts '# AUTO-GENERATED'
    puts
    puts merged.to_yaml
  end
end

UpdateLocale.new.main
