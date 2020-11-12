const productCategories = [
  { name: "jackets", token: "all/jackets" },
  { name: "shirts", token: "all/shirts" },
  { name: "tops/sweaters", token: "all/tops_sweaters" },
  { name: "sweatshirts", token: "all/sweatshirts" },
  { name: "pants", token: "all/pants" },
  { name: "shorts", token: "all/shorts" },
  { name: "hats", token: "all/hats" },
  { name: "bags", token: "all/bags" },
  { name: "accessories", token: "all/accessories" },
  { name: "shoes", token: "all/shoes" },
  { name: "skate", token: "all/skate" },
];

$(function () {

  loadProductData();

  $("#product-form").on("submit", function (e) {
    e.preventDefault();
    const category = $("#product-category").val();
    const keyword = $("#product-keyword").val();
    const style = $("#product-style").val();
    const size = $("#product-size").val();

    const auto_refresh = $("#auto-refresh").is(":checked");
    const random_style = $("#random-style").is(":checked");
    const random_size = $("#random-size").is(":checked");

    const product = { category, keyword, style, size, auto_refresh, random_style, random_size };

    chrome.storage.local.set({ supreme: product }, function () {
      toastr.success('Data has been saved!');
    });
  });
});

function loadProductData() {
  chrome.storage.local.get(['supreme'], function (dt) {
    const { supreme: product } = dt;
    const category = product && product.category ? product.category : "";
    const keyword = product && product.keyword ? product.keyword : "";
    const style = product && product.style ? product.style : "";
    const size = product && product.size ? product.size : "";

    const auto_refresh = product ? product.auto_refresh || false : false;
    const random_style = product ? product.random_style || false : false;
    const random_size = product ? product.random_size || false : false;

    $("#product-category").val(category);
    $("#product-keyword").val(keyword);
    $("#product-style").val(style);
    $("#product-size").val(size);

    $("#auto-refresh").prop("checked", auto_refresh);
    $("#random-style").prop("checked", random_style);
    $("#random-size").prop("checked", random_size);
  });
}
