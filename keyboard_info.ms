<div id="keyboard_info">
<table>
<colgroup><col></col></colgroup>
<colgroup>
  {{#headers}}
  <col id="keyinfo-col-{{pitch}}"></col>
  {{/headers}}
</colgroup>
<thead>
  <th>Pitch</th>
  {{#headers}}
  <th id="keyinfo-col-{{pitch}}">{{pitch}}</th>
  {{/headers}}
</thead>
<tbody>
  <tr id="keyinfo-row-offset">
    <td>Offset</td>
    {{#headers}}
    <td id="keyinfo-offset-{{pitch}}">{{offset}}</td>
    {{/headers}}
  </tr>
  <tr id="keyinfo-row-ratio">
    <td>Ratio</td>
    {{#headers}}
    <td id="keyinfo-ratio-{{pitch}}">{{ratio}}</td>
    {{/headers}}
  </tr>
</tbody>
</table>
</div>
