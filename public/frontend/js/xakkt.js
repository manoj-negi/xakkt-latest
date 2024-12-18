function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(showPosition);
  } else {
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showPosition(position) {
  x.innerHTML =
    "Latitude: " +
    position.coords.latitude +
    "<br>Longitude: " +
    position.coords.longitude;
}

$("#storeCarousel").on("slide.bs.carousel", function (e) {
  showPosition(e.relatedTarget.dataset.lat, e.relatedTarget.dataset.long);
});

function showPosition(lat, long) {
  var lat = lat;
  var lon = long;
  var latlon = new google.maps.LatLng(lat, lon);
  var mapholder = document.getElementById("map");

  var myOptions = {
    center: latlon,
    zoom: 19,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    navigationControlOptions: {
      style: google.maps.NavigationControlStyle.SMALL,
    },
  };

  var map = new google.maps.Map(document.getElementById("map"), myOptions);
  var marker = new google.maps.Marker({
    position: latlon,
    map: map,
    title: "You are here!",
  });
}

function showError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      alert("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      alert("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      alert("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      alert("An unknown error occurred.");
      break;
  }
}

$(".owl-carousel") &&
  $(".owl-carousel").length &&
  $(".owl-carousel").owlCarousel({
    stagePadding: 50,
    loop: false,
    margin: 10,
    nav: true,
    navText: [
      "<div class='nav-btn prev-slide'></div>",
      "<div class='nav-btn next-slide'></div>",
    ],
    responsive: {
      0: {
        items: 1,
      },
      600: {
        items: 3,
      },
      1000: {
        items: 6,
      },
    },
  });

$(".carousel") &&
  $(".carousel").length &&
  $(".carousel").carousel({
    interval: false,
    touch: true,
  });

$(document).ready(function () {
  if ($(".bbb_viewed_slider").length) {
    var viewedSlider = $(".bbb_viewed_slider");

    viewedSlider.owlCarousel({
      stagePadding: 50,
      lazyLoad: true,
      loop: false,
      autoplay: true,
      autoplayTimeout: 6000,
      nav: true,
      dots: false,
      responsive: {
        0: {
          items: 1,
        },
        575: {
          items: 2,
        },
        768: {
          items: 3,
        },
        991: {
          items: 4,
        },
        1199: {
          items: 6,
        },
      },
    });

    if ($(".bbb_viewed_prev").length) {
      var prev = $(".bbb_viewed_prev");
      prev.on("click", function () {
        viewedSlider.trigger("prev.owl.carousel");
      });
    }

    if ($(".bbb_viewed_next").length) {
      var next = $(".bbb_viewed_next");
      next.on("click", function () {
        viewedSlider.trigger("next.owl.carousel");
      });
    }
  }

  if ($(".ccc_viewed_slider").length) {
    var viewedCSlider = $(".ccc_viewed_slider");

    viewedCSlider.owlCarousel({
      stagePadding: 50,
      lazyLoad: true,
      loop: false,
      autoplay: true,
      autoplayTimeout: 6000,
      nav: false,
      dots: false,
      responsive: {
        0: {
          items: 1,
        },
        575: {
          items: 2,
        },
        768: {
          items: 3,
        },
        991: {
          items: 4,
        },
        1199: {
          items: 6,
        },
      },
    });

    if ($(".ccc_viewed_prev").length) {
      var prev = $(".ccc_viewed_prev");
      prev.on("click", function () {
        viewedCSlider.trigger("prev.owl.carousel");
      });
    }

    if ($(".ccc_viewed_next").length) {
      var next = $(".ccc_viewed_next");
      next.on("click", function () {
        viewedCSlider.trigger("next.owl.carousel");
      });
    }
  }
});

$(document).delegate(".minus-btn", "click", function (e) {
  input = $(this).closest("div").find("input");
  value = parseInt(input.val());
  value = value > 1 ? value - 1 : 1;
  input.val(value);

  if ($(this).data("storeid")) {
    var data = {};
    data._store = $(this).data("storeid");
    data._product = $(this).data("productid");
    data.quantity = value;

    $.post("/cart/update_quantity?view_cart=1", data)
      .done((result) => {
        $(".cart-price").html(result.subtotal.sub_total);
        let productData = result.data.cart.filter(
          (item) => item._product._id === data._product
        );
        const { _product } = productData?.[0];
        $(`#total_qnty_${data._product}`)[0].innerText = Number(
          _product.total_price
        ).toFixed(2);
        $(".lblCartCount").html(result.total_products);
      })
      .fail((result) => {
        console.log(result);
        $("#error").show().text(result.responseJSON.errors);
      });
  }
});

$(document).delegate(".plus-btn", "click", function (e) {
  input = $(this).closest("div").find("input");
  value = parseInt(input.val());
  value = value < 100 ? value + 1 : 100;
  input.val(value);

  if ($(this).data("storeid")) {
    var data = {};
    data._store = $(this).data("storeid");
    data._product = $(this).data("productid");
    data.quantity = value;
    // data.total_price =
    console.log("quamtou?=>", value);
    console.log("data._product==>", data);

    $.post("/cart/update_quantity?view_cart=1", data)
      .done((result) => {
        $(".cart-price").html(result.subtotal.sub_total);
        console.log("result===>", result);
        let productData = result.data.cart.filter(
          (item) => item._product._id === data._product
        );
        const { _product } = productData?.[0];
        $(`#total_qnty_${data._product}`)[0].innerText = Number(
          _product.total_price
        ).toFixed(2);
        $(".lblCartCount").html(result.total_products);
      })
      .fail((result) => {
        console.log(result);
        $("#error").show().text(result.responseJSON.errors);
      });
  }
});

const regForm = $("#registration");
const loginForm = $("#login");

regForm.on("submit", function (e) {
  e.preventDefault();
  const obj = regForm
    .serializeArray()
    .reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {});

  $.post("/user/create", obj)
    .done((result) => {
      if (!result.status) {
        $("#error").show().text(result.errors);
      } else {
        Swal.fire({
          icon: "success",
          title: "Signed up, try to login",
          showConfirmButton: false,
          timer: 1500,
        });
        $("#modalLoginForm").modal("show");
        //window.location.href = `${baseUrl}/user/login`;
      }
    })
    .fail((result) => {
      console.log(result);
      $("#error").show().text(result.responseJSON.errors);
    });
});

loginForm.on("submit", function (e) {
  e.preventDefault();
  const obj = loginForm
    .serializeArray()
    .reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {});
  $.post("/user/login", obj)
    .done((result) => {
      if (!result.status) {
        $("#loginError").show().text(result.errors);
      } else {
        Swal.fire({
          icon: "success",
          title: "Logged in successfully",
          showConfirmButton: false,
          timer: 1500,
        });
        window.location.href = baseUrl;
      }
    })
    .fail((result) => {
      $("#loginError").show().text(result.responseJSON.errors);
    });
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});

$(".product_view").on("show.bs.modal", function (e) {
  var a = $(e.relatedTarget);

  var modal = $(this);
  modal.find(".xproduct-img").prop("src", a.data("img"));
  modal.find(".modal-title").text(a.data("product-name"));
  if (parseInt(a.data("deal-price"))) {
    modal.find(".deal-price").text(a.data("deal-price"));
    modal.find(".regular-price").text(a.data("regular-price"));
  } else {
    modal.find(".deal-price").text(a.data("regular-price"));
    modal.find(".regular-price").text("");
  }

  modal.find(".d-product").val(a.data("id"));
  modal.find(".sku").text(a.data("sku"));
  modal.find(".currency").text(a.data("store-currency"));
  modal.find(".size").text(a.data("size"));
  modal.find(".unit").text(a.data("unit"));
});

$(document).delegate(".x-cart,.x-heart,.x-list", "click", function () { 
  if (!$(".cartbutton").data("userid")) {
    $("#modalLoginForm").modal("show");
    return false;
  }
  var btntype = $(this).data("prop");
  switch (btntype) {
    case "x-cart":
      productId = $(this).data("productid");

      greyClass = `.${btntype}-grey-${productId}`;
      redClass = `.${btntype}-red-${productId}`;

      $(`${greyClass},${redClass}`).toggleClass("d-none");
      $(this).parents(".xshop").siblings(".button_type").val(btntype);
      $(this).closest("form").submit();
      break;
    case "x-heart":
      productId = $(this).data("productid");

      greyClass = `.${btntype}-grey-${productId}`;
      redClass = `.${btntype}-red-${productId}`;

      $(`${greyClass},${redClass}`).toggleClass("d-none");
      $(this).parents(".xshop").siblings(".button_type").val(btntype);
      $(this).closest("form").submit();
      break;
    case "x-list":
      $(this).parents(".xshop").siblings(".button_type").val(btntype);
      if (!$(this).data("action")) {
        $(".shoplist").val("");

        productId = $(this).data("productid");

        greyClass = `.${btntype}-grey-${productId}`;
        redClass = `.${btntype}-red-${productId}`;

        $(`${greyClass}`).removeClass("d-none");
        $(`${redClass}`).addClass("d-none");

        $(this).closest("form").submit();
      }
      break;
  }
});

/*----- product details page ----*/

$(".xakkt-product-popup").click(function () {
  switch (true) {
    case $(this).hasClass("shoplist"):
      $(".grey-list, .red-list").toggleClass("d-none");
      url = `${baseUrl}/product/add-to-cart`;
      break;
    case $(this).hasClass("favlist"):
      $(".grey-fav, .red-fav").toggleClass("d-none");
       url = `${baseUrl}/product/add-to-favlist`;
      break;
    case $(this).hasClass("xcart"):
      $(".cart-grey, .cart-red").toggleClass("d-none");
      url = `${baseUrl}/shoppinglist/add_product`;
      break;
  }

  $.post(url, obj)
    .done((result) => {
      if (result.data.iscart)
        $(".lblCartCount")
          .removeClass("d-none")
          .html(result.data.total_products);
      $(`#error-${obj.button_type}`).removeClass("d-none").html(result.message);
    })
    .fail((result) => {
      $(`#error-${obj.button_type}`)
        .removeClass("d-none")
        .html(result.responseJSON.message);
    });
});

/* ------ end -------*/

$(document).delegate(".cart-form", "submit", function (e) {
  e.preventDefault();
  const obj = $(this)
    .serializeArray()
    .reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {});

  switch (obj.button_type) {
    case "x-cart":
      url = `${baseUrl}/product/add-to-cart`;
      break;
    case "x-heart": 
      url = `${baseUrl}/product/add-to-favlist`;
      break;
    case "x-list": 
      url = `${baseUrl}/shoppinglist/add_product`;
  }
  $.post(url, obj)
    .done((result) => {
      if (result.data.iscart)
        $(".lblCartCount")
          .removeClass("d-none")
          .html(result.data.total_products);
      $(`#error-${obj.button_type}`).removeClass("d-none").html(result.message);
    })
    .fail((result) => {
      $(`#error-${obj.button_type}`)
        .removeClass("d-none")
        .html(result.responseJSON.message);
    });
});

$(function () {
  data = {
    _user: $(".cartbutton").data("userid"),
    _store: $(".cartbutton").data("storeid"),
  };

  $(".cartbutton").data("userid") &&
    $.post(`${baseUrl}/product/cart-size`, data)
      .done((result) => {
        if (result.status) {
          $(".lblCartCount").removeClass("d-none");
          $(".lblCartCount").html(result.data.total_products);
        }
        //$(`#error-${obj.button_type}`).removeClass('d-none').html(result.message);
      })
      .fail((result) => {
        //$(`#error-${obj.button_type}`).removeClass('d-none').html(result.responseJSON.message);
      });
});

/*
$('#cartbutton').on('click',function(){
   if(!$(this).data('storeid')){ 

    Swal.fire({
      title: "No store selected!",
      text: "For your cart, you need to select your store first",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }) 

    }else{
          $('#cartModal').modal('show')
    }
})*/

$(".xakkt-popup").on("click", function (e) {
  if (!$(this).data("storeid")) {
    Swal.fire({
      title: "No store selected!",
      text: "For your cart, you need to select your store first",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });
  } else {
    var modal = $(this).data("modal");
    $(`#${modal}`).modal("show");
  }
});

$("#wishPriceModal").on("show.bs.modal", function (e) {
  var data = {};
  var targetData = $(e.relatedTarget);
  $("#wishlistproduct").val(targetData.data("productid"));
});

$(".x-remove-wishlist").on("click", function () {
  var product_id = $(this).attr("data-productid");

  $.get(`/wishlist/lists/${product_id}`).done((result) => {
    $(this).attr("data-id", result.data);

    console.log("this 1" + $(this));

    deleteFavouriteProduct($(this), product_id);
  });
});

$("#save-wish-price").on("submit", function (e) {
  e.preventDefault();
  let formdata = $(this).serializeArray();
  console.log("--formdata--", formdata);

  var data = {};
  data._user = $(".cartbutton").data("userid") ?? null;
  data._store = $(".cartbutton").data("storeid");
  data._product = formdata[0].value;
  data.wish_price = formdata[1].value;
  // data.max_price = formdata[2].value;

  $.post(`${baseUrl}/product/add-to-favlist`, data)
    .done((result) => {
      const productId = data._product;
      var greyClass = `.${btntype}-grey-${productId}`;
      var redClass = `.${btntype}-red-${productId}`;
      var btntype = $(this).data("prop");
      // $(`${greyClass},${redClass}`).toggleClass("d-none");

      if (result.status) {
        if (result.status == 2) {
          $("#wishlistError").show().text(result.message);
        } else {
          Swal.fire({
            icon: "success",
            title: "Product Added to wishlist",
            showConfirmButton: false,
            timer: 1500,
          });
          // redClass = `.${btntype}-red-${productId}`;
          $(`${redClass}`).removeClass("d-none");
          $(`${greyClass}`).addClass("d-none");
          location.reload();
        }
      }
    })
    .fail((result) => {
      $("#loginError").show().text(result.responseJSON.errors);
    });
});

$("#favListModal").on("show.bs.modal", function (e) {
  var data = {};
  data._user = $(".cartbutton").data("userid") ?? null;
  data._store = $(".cartbutton").data("storeid");

  $.post("/wishlist/products", data)
    .done((result) => {
      if (result.status) {
        var tableHtml = "";
        var total = 0;
        result.data.forEach((product, index) => {
          tableHtml += `<tr>
                            <td class="w-25">
                              <img src="${
                                product._product.image
                              }" class="cart-prod-img img-fluid img-thumbnail" alt="">
                            </td>
                            <td>${product._product.name.english}</td>
                            <td>${product._product.wish_price}</td>
                            <td class="qty">
                                <div class="quantity">
                                  <button class="xbtn minus-btn" data-place="fav_${
                                    product._product._id
                                  }" type="button" name="button">
                                      <i class="fa fa-minus" aria-hidden="true"></i>
                                  </button>
                                  <input type="text" form="fav_${
                                    product._product._id
                                  }" class="cartqnty" name="quantity" value=1>
                                  <button class="xbtn plus-btn" data-place="fav_${
                                    product._product._id
                                  }" type="button" name="button">
                                      <i class="fa fa-plus" aria-hidden="true"></i>
                                  </button>
                                  
                                </div>
                            </td>
                            <td>
                            <form class="cart-form" method="post" id="fav_${
                              product._product._id
                            }">
                                <input type="hidden" name="_product" value="${
                                  product._product._id
                                }" />
                                <input type="hidden" class="button_type" name="button_type" value=""/>
                                <input type="hidden" class="shoplist" name="_shoppinglist" value="" />
                                <input type="hidden" name="_store" value=${$(
                                  ".cartbutton"
                                ).data("storeid")} /> 
                                <input type="hidden" class="user" name="_user" value=${$(
                                  ".cartbutton"
                                ).data("userid")} />
                                <span class="action_icon xshop">
                                      
                                <img style="width:26px" data-id="${
                                  product._product._id
                                }" data-prop="x-list" data-toggle="modal" data-formid="fav_${
            product._product._id
          }" data-action=1 data-target="#shoppingListModal" class="img-responsive x-list xakkti xakkt-popup x-list-grey-${
            product._product._id
          } ${
            product._product.in_shoppinglist ? "d-none" : ""
          }" src="${baseUrl}/frontend/images/GREY_Shopping_List.png" title="Add to shopping list" alt="No Image">
                                
                                <img style="width:26px" data-action=0 data-productid="${
                                  product._product._id
                                }" data-prop="x-list" class="img-responsive x-list xakkti xakkt-popup ${
            product._product.in_shoppinglist ? "" : "d-none"
          } x-list-red-${
            product._product._id
          }" src="${baseUrl}/frontend/images/RED_shopping_List.png" title="Remove from all shopping lists" alt="No Image">
                                      
                                </span>
                                <span class="action_icon xshop">
                                       <img class="img-responsive xakkti x-cart x-cart-red-${
                                         product._product._id
                                       } ${
            product._product.in_cart ? "" : "d-none"
          }" title="Remove from Cart" data-prop="x-cart" data-productid="${
            product._product._id
          }" src="${baseUrl}/frontend/images/RED_Cart.png" alt="No Image">
        
                                       <img class="img-responsive xakkti x-cart x-cart-grey-${
                                         product._product._id
                                       } ${
            product._product.in_cart ? "d-none" : ""
          }" title="Add to Cart" data-prop="x-cart" data-productid="${
            product._product._id
          }" src="${baseUrl}/frontend/images/GREY_Cart.png" alt="No Image"> 
             
                                </span>
                                <span class="action_icon" data-id="${
                                  product._id
                                }" onclick="deleteFavouriteProduct(this)">
                                    <img style="width:26px" data-prop="x-delete" class="img-responsive" src="${baseUrl}/frontend/images/trash.png" title="Add to shopping list" alt="No Image">
                                </span>
                              
                              </form>
                            </td>
                      </tr>`;
        });
      } else {
        tableHtml = `<tr>
                                <td colspan="5">
                                No data for cart
                                </td>
                              </tr>`;
        $(".fav-table").html();
      }
      $("#fav-table").html(tableHtml);
    })
    .fail((result) => {
      $("#loginError").show().text(result.responseJSON.errors);
    });
});

$("#cartModal").on("show.bs.modal", function () {
  var data = {};
  data.userid = $(".cartbutton").data("userid") ?? null;
  data.storeid = $(".cartbutton").data("storeid");
  $.post("/products/cart", data)
    .done((result) => {
      //  console.log('cart api result =======>>>',result)
      if (result.status) {
        var tableHtml = "";
        var total = 0;
        result.data.forEach((product, index) => {
          total += product.total_price;

          tableHtml += `<tr>
                            <td class="w-25">
                              <img src="${imageBaseUrl}/products/${
            product._product.image
          }" class="cart-prod-img img-fluid img-thumbnail" alt="Sheep">
                            </td>
                            <td>${product._product.name.english}</td>
                            <td class="qty">
                                <div class="quantity">
                                  <button class="xbtn minus-btn"  data-storeid="${
                                    data.storeid
                                  }" data-productid="${
            product._product._id
          }" type="button" name="button">
                                      <i class="fa fa-minus" aria-hidden="true"></i>
                                  </button>
                                  <input type="text" class="cartqnty" name="quantity" value="${
                                    product.quantity
                                  }">
                                  <button class="xbtn plus-btn" data-storeid="${
                                    data.storeid
                                  }" data-productid="${
            product._product._id
          }" type="button" name="button">
                                      <i class="fa fa-plus" aria-hidden="true"></i>
                                  </button>
                                  
                                </div>
                            </td>
                            
                            <td id='total_qnty_${
                              product._product._id
                            }'>${product.total_price.toFixed(2)}</td>
                            <td> <span data-storeid="${
                              data.storeid
                            }" data-productid="${
            product._product._id
          }" class="action_icon" onclick="removeProductFromCart(this)"><i class="fa fa-trash"></i></span> </td>
                          
                      </tr>`;
        });
        $(".cart-price").html(total.toFixed(2));
      } else {
        tableHtml = `<tr>
                                <td colspan="5">
                                No data for cart
                                </td>
                              </tr>`;
        $(".cart-price").html();
      }
      $("#cart-table").html(tableHtml);
    })
    .fail((result) => {
      console.log("--error in cart listing --", result);
      $("#loginError").show().text(result.responseJSON.errors);
    });
});

$("#shoppingListModal").on("show.bs.modal", function (event) {
  if (!$(".cartbutton").data("userid")) {
    $("#modalLoginForm").modal("show");
    return false;
  }

  var data = {};
  data._user = $(".cartbutton").data("userid") ?? null;
  data._store = $(".cartbutton").data("storeid");

  var button = $(event.relatedTarget); // Button that triggered the modal
  var productForm = button.data("formid");
  var productId = button.data("id");
  let section = button.data("prop");

  $.post("/list/shoppinglist", data)
    .done((result) => {
      if (result.status) {
        var tableHtml = "";
        result.data.forEach((list, index) => {
          tableHtml += `<tr>
                                            <td class="lsname" data-section="${section}" data-productid=${productId} data-formid="#${productForm}" onclick="listnameClick(this)" data-id="${list._id}">${list.name}</td>
                                          </tr>`;
        });
      } else {
        tableHtml = `<tr> <td> No data for cart </td> </tr>`;
      }
      $("#shopping-table").html(tableHtml);
    })
    .fail((result) => {
      $("#loginError").show().text(result.responseJSON.errors);
    });
});

// -------------->
const creat = $("#createShopping");
creat.on("submit", function (e) {
  e.preventDefault();
  const data = creat
    .serializeArray()
    .reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {});

  $.post("/shoppinglist/create", data)
    .done((result) => {
      if (result?.status === 1) {
        console.log("======staus", result?.status);
        Swal.fire({
          icon: "success",
          title: "Shopping List Created",
          showConfirmButton: false,
          timer: 1500,
        });
        location.reload();
      } else {
        console.log("====ll", result.message);
        $("#err").show().text(result?.message);
      }
    })
    .fail((result) => {
      console.log(result.responseJSON.message);
      $("#err").show().text(result?.responseJSON?.message);
    });
});

//  shoping list
$("#allAhoppingListsModal").on("show.bs.modal", function (event) {
  var data = {};
  data._user = $(".cartbutton").data("userid") ?? null;
  data._store = $(".cartbutton").data("storeid");

  $.post("/list/shoppinglist", data)
    .done((result) => {
      if (result.status) {
        var tableHtml = "";
        result.data.forEach((list, index) => {
          tableHtml += `<tr>
                                            <td class="lsproducts" data-toggle="modal" data-target="#shoppingListProducsModal" data-listid="${list._id}">${list.name}</td>
                                            
                                            <td data-listid="${list._id}" data-toggle="modal" class="action_icon lsproducts" onclick="deleteShoppinglist(this)"><i class="fa fa-trash" aria-hidden="true"></i></span> </td>
                                          </tr>`;
        });
      } else {
        tableHtml = `<tr> <td> No data for cart </td> </tr>`;
      }
      $("#shopping-table-navbar").html(tableHtml);
    })
    .fail((result) => {
      $("#loginError").show().text(result.responseJSON.errors);
    });
});
// =========>
$("#shoppingListProducsModal").on("show.bs.modal", function (event) {
  $("#allAhoppingListsModal").modal("hide");

  var button = $(event.relatedTarget); // Button that triggered the modal
  var shoplist = button.data("listid");

  $.get(`/shoppinglist/${shoplist}/products`)
    .done((result) => {
      if (result.status) {
        var tableHtml = "";
        result.data.forEach((product, index) => {
          listname = product._shoppinglist.name;
          tableHtml += `<tr>
                                            <td class="w-25">
                                              <img src="${
                                                product._product.image
                                              }" class="cart-prod-img img-fluid img-thumbnail" alt="no image available">
                                            </td>
                                            <td>${
                                              product._product.name.english
                                            }</td>
                                            <td class="qty">
                                              <div class="quantity">
                                                <button class="xbtn minus-btn" type="button" name="button">
                                                    <i class="fa fa-minus" aria-hidden="true"></i>
                                                </button>
                                                <input form="shipping_${
                                                  product._product._id
                                                }" type="text" class="cartqnty" name="quantity" value=1>
                                                <button class="xbtn plus-btn" type="button" name="button">
                                                    <i class="fa fa-plus" aria-hidden="true"></i>
                                                </button>
                                                
                                              </div>
                                            </td>
                                            
                                            <td>${
                                              product._product._unit.name
                                            }</td>
                                            <td>
                                            <form class="cart-form" method="post" id="shipping_${
                                              product._product._id
                                            }">
                                            <input type="hidden" name="_product" value="${
                                              product._product._id
                                            }" />
                                            <input type="hidden" class="button_type" name="button_type" value=""/>
                                            <input type="hidden" class="shoplist" name="_shoppinglist" value="" />
                                            <input type="hidden" name="_store" value=${$(
                                              ".cartbutton"
                                            ).data("storeid")} /> 
                                            <input type="hidden" class="user" name="_user" value=${$(
                                              ".cartbutton"
                                            ).data("userid")} />
                                            <span class="action_icon xshop">
                                                  
                                            <img style="width:26px" data-id="${
                                              product._product._id
                                            }" data-prop="x-list" data-toggle="modal" data-formid="shipping_${
            product._product._id
          }" data-action=1 data-target="#shoppingListModal" class="img-responsive x-list xakkti xakkt-popup x-list-grey-${
            product._product._id
          } ${
            product._product.in_shoppinglist ? "d-none" : ""
          }" src="${baseUrl}/frontend/images/GREY_Shopping_List.png" title="Add to shopping list" alt="No Image">
                                            
                                            <img style="width:26px" data-action=0 data-productid="${
                                              product._product._id
                                            }" data-prop="x-list" class="img-responsive x-list xakkti xakkt-popup ${
            product._product.in_shoppinglist ? "" : "d-none"
          } x-list-red-${
            product._product._id
          }" src="${baseUrl}/frontend/images/RED_shopping_List.png" title="Remove from all shopping lists" alt="No Image">
                                                  
                                            </span>
                                            <span class="action_icon xshop">
                                                   <img class="img-responsive xakkti x-cart x-cart-red-${
                                                     product._product._id
                                                   } ${
            product._product.in_cart ? "" : "d-none"
          }" title="Remove from Cart" data-prop="x-cart" data-productid="${
            product._product._id
          }" src="${baseUrl}/frontend/images/RED_Cart.png" alt="No Image">
                    
                                                   <img class="img-responsive xakkti x-cart x-cart-grey-${
                                                     product._product._id
                                                   } ${
            product._product.in_cart ? "d-none" : ""
          }" title="Add to Cart" data-prop="x-cart" data-productid="${
            product._product._id
          }" src="${baseUrl}/frontend/images/GREY_Cart.png" alt="No Image"> 
                         
                                            </span>
                                            <span class="action_icon" data-id="${
                                              product._id
                                            }" onclick="deleteProductFromShoppingList(this)">
                                                <img style="width:26px" data-prop="x-delete" class="img-responsive" src="${baseUrl}/frontend/images/trash.png" title="Add to shopping list" alt="No Image">
                                            </span>
                                          
                                          </form>
                                            </td>
                                      </tr>`;
        });
      } else {
        tableHtml = `<tr> <td> No data for cart </td> </tr>`;
      }
      $("#shoppinglist-product-table").html(tableHtml);
      $("#shopListModalLabel").html(listname);
    })
    .fail((result) => {
      $("#loginError").show().text(result.responseJSON.errors);
    });
});
function listnameClick(that) {
  $(".shoplist").val($(that).data("id"));

  section = $(that).data("section");
  productId = $(that).data("productid");

  let greyClass = `.${section}-grey-${productId}`;
  let redClass = `.${section}-red-${productId}`;

  $(that).toggleClass("active");

  if ($(".lsname").hasClass("active")) {
    $(`${greyClass}`).addClass("d-none");
    $(`${redClass}`).removeClass("d-none");
  } else {
    $(`${greyClass}`).removeClass("d-none");
    $(`${redClass}`).addClass("d-none");
  }

  $($(that).data("formid")).submit();
}
function deleteFavouriteProduct(that, productid) {
  var listid = $(that).data("id");
  var productid = $(that).data("product_id");
  section = $(that).data("section");
  var greyClass = `.${section}-grey-${productid}`;
  var redClass = `.${section}-red-${productid}`;
  $.get(`/wishlist/remove/product/${listid}`)
    .done((result) => {
      console.log(result);

      $(`${greyClass}`).removeClass("d-none");
      $(`${redClass}`).addClass("d-none");
      location.reload();
    })
    .fail((result) => {
      //$("#loginError").show().text(result.responseJSON.errors);
    });
  $(that).parents("tr").remove();
}

//  delete shopping list --------------
function deleteShoppinglist(that) {
  var listid = $(that).data("listid");
  $.post(`/shoppinglist/remove/${listid}`)
    .done((result) => {
      Swal.fire({
        title: "Once deleted, you will not be able to recover this record?",
        icon: "info",
        showDenyButton: false,
        showCancelButton: true,
        confirmButtonText: "Ok",
        denyButtonText: `Don't save`,
      }).then((result) => {
        if (result.isConfirmed) {
          $(that).parents("tr").remove();
          Swal.fire("done!", "", "success");
        } else if (result.isDenied) {
          Swal.fire("Changes are not saved", "", "info");
        }
      });
    })
    .fail((result) => {
      console.log("err=>", result);
      $("#loginError").show().text(result.responseJSON.err);
    });
}
// ===========

function removeFromAllShoppingList(that) {
  $.post("/shoppinglists/removeproduct/", data)
    .done((result) => {
      if (result.status) {
        var tableHtml = "";
        result.data.forEach((list, index) => {
          tableHtml += `<tr>
                            <td class="lsproducts" data-toggle="modal" data-target="#shoppingListProducsModal" data-listid="${list._id}">${list.name}</td>
                          </tr>`;
        });
      } else {
        tableHtml = `<tr> <td> No data for cart </td> </tr>`;
      }
      $("#shopping-table-navbar").html(tableHtml);
    })
    .fail((result) => {
      $("#loginError").show().text(result.responseJSON.errors);
    });
}

function removeProductFromCart(that) {
  var data = {};
  data.userid = $(".cartbutton").data("userid") ?? null;
  data._store = $(that).data("storeid");
  data._product = $(that).data("productid");

  if ($("#cart-table .action_icon").length == 1) {
    $.post(`/cart/empty_cart/${data._store}`, data)
      .done((result) => {
        result.status && $(that).parents("tr").remove();
        $(".cart-price").html(0);
        $(".lblCartCount").addClass("d-none").html(0);
      })
      .fail((result) => {
        $("#loginError").show().text(result.responseJSON.errors);
      });
  } else {
    $.post("/product/remove-from-cart", data)
      .done((result) => {
        $(".cart-price").html(result.subtotal.price);
        $(".lblCartCount").html(result.subtotal.quantity);
        result.status && $(that).parents("tr").remove();
      })
      .fail((result) => {
        $("#loginError").show().text(result.responseJSON.errors);
      });
  }

  $.post("/product/remove-from-cart", data)
    .done((result) => {
      result.status && $(that).parents("tr").remove();
    })
    .fail((result) => {
      $("#loginError").show().text(result.responseJSON.errors);
    });
}
function deleteProductFromShoppingList(that) {
  var lsitid = $(that).data("id");
  $.get(`/shoppinglist/remove_product/${lsitid}`)
    .done((result) => {
      result.status && $(that).parents("tr").remove();
    })
    .fail((result) => {
      $("#shoplisterror")
        .removeClass("d-none")
        .text(result.responseJSON.errors);
    });
}

$("#shoppingListModal").on("hide.bs.modal", function (e) {
  $("#error-x-list").html("").addClass("d-none");
});

$(".xact-add-card").click(function () {
  $(".xact-add-card").removeClass("active");
  $(this).toggleClass("active");
});

$(".x-order-head").click(function () {
  $(this).next(".gold-members").toggle(1000);
});

/*$('#categorymodel').click(function() {
  // alert("hello")
  window.location.href='/<%=store.slug%>/main-category/products/<%=key.replace(/ /g, "-").toLowerCase() %>';
});*/

$("#modalLoginForm").on("show.bs.modal", function (e) {
  $("#modalRegisterForm").modal("hide");
});
$("#modalRegisterForm").on("show.bs.modal", function (e) {
  $("#modalLoginForm").modal("hide");
});

$("#forgotPasswordModal").on("show.bs.modal", function () {});
$("#createShoppingList").on("show.bs.modal", function () {
  $("#allAhoppingListsModal").modal("hide");
});
$("#slclose").click(function () {
  $("#createShoppingList").modal("hide");
  $("#allAhoppingListsModal").modal("show");
});
