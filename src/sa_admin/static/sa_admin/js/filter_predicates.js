containsSubstring(column, place, ) {
  const filterValue = this.el.querySelector('input').value;
  if (!filterValue) { return true; }

  const attrValue = place.get(this.column.attr);
  return attrValue.includes(filterValue);
}