(function () {
    "use strict";

    // Navigation management
    function setupNavigation() {
        const homeLink = document.getElementById("homeLink");
        const aboutLink = document.getElementById("aboutLink");
        const reportsLink = document.getElementById("reportsLink");

        const mainContentContainer = document.getElementById(
            "mainContentContainer"
        );
        const aboutPage = document.getElementById("aboutPage");
        const reportsPage = document.getElementById("reportsPage");

        function hideAllPages() {
            mainContentContainer.style.display = "none";
            aboutPage.style.display = "none";
            reportsPage.style.display = "none";
        }

        // Home link
        homeLink.addEventListener("click", (e) => {
            e.preventDefault();
            hideAllPages();
            mainContentContainer.style.display = "block";
            if (window.stopCryptoChart) window.stopCryptoChart();
        });

        // About link
        aboutLink.addEventListener("click", (e) => {
            e.preventDefault();
            hideAllPages();
            aboutPage.style.display = "block";
            if (window.stopCryptoChart) window.stopCryptoChart();
        });

        // Reports link
        reportsLink.addEventListener("click", (e) => {
            e.preventDefault();
            hideAllPages();
            reportsPage.style.display = "block";
            console.log("Reports link clicked, initializing chart...");
            initCryptoChart();
        });
    }

    // Show loading placeholders
    function showLoadingPlaceholders() {
        const contentDiv = document.getElementById("contentDiv");
        let placeholderContent = "";
        const placeholderCount = 10;

        for (let i = 0; i < placeholderCount; i++) {
            placeholderContent += `
                <div class="card" aria-hidden="true">
                    <div class="placeholder-glow">
                        <span class="placeholder col-12" style="height: 200px;"></span>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title placeholder-glow">
                            <span class="placeholder col-6"></span>
                        </h5>
                        <p class="card-text placeholder-glow">
                            <span class="placeholder col-7"></span>
                            <span class="placeholder col-4"></span>
                            <span class="placeholder col-4"></span>
                            <span class="placeholder col-6"></span>
                        </p>
                        <a class="btn btn-primary disabled placeholder col-6" aria-disabled="true"></a>
                    </div>
                </div>
            `;
        }

        contentDiv.innerHTML = placeholderContent;
    }

    // Main function to load and display coins
    async function loadCoins() {
        // Show loading placeholders immediately
        showLoadingPlaceholders();

        try {
            const url =
                "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";
            const coins = await getCoins(url);
            displayCoins(coins);
        } catch (err) {
            console.error("Error loading coins:", err);
            const contentDiv = document.getElementById("contentDiv");
            contentDiv.innerHTML = `
                <div class="alert alert-danger">
                    Unable to load coins. Please try again later.
                    <br>Error: ${err.message}
                </div>
            `;
        }
    }

    // Fetch coins from API
    async function getCoins(url) {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (err) {
            console.error("API request failed:", err);
            throw new Error("Failed to fetch cryptocurrency data");
        }
    }

    // Fetch detailed coin information
    async function fetchCoinDetails(coinId) {
        try {
            const url = `https://api.coingecko.com/api/v3/coins/${coinId}`;
            const response = await axios.get(url);
            return response.data;
        } catch (err) {
            console.error(`Error fetching details for coin ${coinId}:`, err);
            return null;
        }
    }

    // Update coin details in the collapse section
    function updateCoinDetailsInUI(coinId, details) {
        const collapseElement = document.getElementById(coinId);
        if (!collapseElement) return;

        const detailsBody = collapseElement.querySelector(".card-body");
        if (!detailsBody) return;

        if (
            details &&
            details.market_data &&
            details.market_data.current_price
        ) {
            const prices = details.market_data.current_price;
            detailsBody.innerHTML = `
                <span>Price (USD): $${prices.usd.toLocaleString()}</span>
                <br>
                <span>Price (EUR): €${prices.eur.toLocaleString()}</span>
                <br>
                <span>Price (ILS): ₪${prices.ils.toLocaleString()}</span>
            `;
        }
    }

    // Display coins in the content div
    function displayCoins(coins) {
        const contentDiv = document.getElementById("contentDiv");

        // Validate input
        if (!Array.isArray(coins) || coins.length === 0) {
            contentDiv.innerHTML =
                '<div class="alert alert-warning">No coins found.</div>';
            return;
        }

        let content = "";
        const displayLimit = 250;

        // Retrieve saved toggle states from localStorage
        const savedToggleStates = JSON.parse(
            localStorage.getItem("coinToggleStates") || "{}"
        );

        for (let i = 0; i < Math.min(coins.length, displayLimit); i++) {
            const coin = coins[i];

            // Validate coin object
            if (!coin || !coin.id || !coin.symbol || !coin.current_price) {
                console.warn(`Skipping invalid coin data:`, coin);
                continue;
            }

            // Get saved toggle state or default to false
            const isToggled = savedToggleStates[coin.id]?.isChecked || false;

            content += `
                <div class="card coin-card position-relative">
                    <div class="card-toggle-container">
                        <div class="form-check form-switch">
                            <input class="form-check-input coin-toggle" 
                                   type="checkbox" 
                                   role="switch" 
                                   id="toggle-${coin.id}" 
                                   data-coin-id="${coin.id}"
                                   data-bs-toggle="popover"
                                   data-bs-trigger="hover"
                                   data-bs-content="${
                                       isToggled ? "Tracking" : "Not Tracking"
                                   }"
                                   ${isToggled ? "checked" : ""}>
                        </div>
                    </div>
                    <img src="${coin.image}" alt="${coin.name}" />
                    <div class="card-body">
                      <div class="card-details">
                        <p>${coin.symbol.toUpperCase()} </p>
                        <p>${coin.name}</p>
                      </div>
                      <button class="btn btn-primary coin-details-btn" type="button" data-bs-toggle="collapse" data-bs-target="#${
                          coin.id
                      }" aria-expanded="false" aria-controls="collapseExample" data-coin-id="${
                coin.id
            }">
                        Show Details
                        </button>
                    </div>
                    <div class="collapse" id="${coin.id}">
                        <div class="card-body">
                          <span>Price (USD): $${coin.current_price.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        contentDiv.innerHTML = content;

        // Initialize popovers
        const popoverTriggerList = document.querySelectorAll(
            '[data-bs-toggle="popover"]'
        );
        const popoverList = [...popoverTriggerList].map(
            (popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl)
        );

        // Add event listeners to toggle switches
        const toggleSwitches = document.querySelectorAll(".coin-toggle");
        toggleSwitches.forEach((toggle) => {
            toggle.addEventListener("change", function () {
                const coinId = this.getAttribute("data-coin-id");
                const isChecked = this.checked;
                const coinSymbol = this.closest(".card").querySelector(
                    ".card-details p:first-child"
                ).textContent;

                // Manually update popover content
                const popoverInstance = bootstrap.Popover.getInstance(this);
                if (popoverInstance) {
                    popoverInstance.dispose(); // Remove existing popover
                }

                // Recreate popover with new content
                new bootstrap.Popover(this, {
                    content: isChecked ? "Tracking" : "Not Tracking",
                    trigger: "hover",
                });

                // Retrieve existing toggle states from localStorage
                const savedToggleStates = JSON.parse(
                    localStorage.getItem("coinToggleStates") || "{}"
                );

                // Update the toggle state for this specific coin
                savedToggleStates[coinId] = {
                    symbol: coinSymbol,
                    isChecked: isChecked,
                };

                // Save updated toggle states back to localStorage
                localStorage.setItem(
                    "coinToggleStates",
                    JSON.stringify(savedToggleStates)
                );
            });
        });

        // Add event listeners to "Show Details" buttons
        const detailsButtons = document.querySelectorAll(".coin-details-btn");
        detailsButtons.forEach((button) => {
            button.addEventListener("click", async (e) => {
                const coinId = e.target.getAttribute("data-coin-id");

                // Prevent multiple API calls for the same coin
                if (e.target.getAttribute("data-details-loaded") === "true")
                    return;

                try {
                    const coinDetails = await fetchCoinDetails(coinId);
                    if (coinDetails) {
                        updateCoinDetailsInUI(coinId, coinDetails);
                        e.target.setAttribute("data-details-loaded", "true");
                    }
                } catch (err) {
                    console.error("Error loading coin details:", err);
                }
            });
        });
    }

    // Search functionality
    function setupSearch() {
        const searchBar = document.getElementById("searchBar");
        const contentDiv = document.getElementById("contentDiv");

        searchBar.addEventListener("input", function () {
            const searchTerm = this.value.trim().toLowerCase();
            const cards = contentDiv.querySelectorAll(".card");

            cards.forEach((card) => {
                // Search across coin symbol, name, and other visible text
                const coinSymbol =
                    card
                        .querySelector(".card-details p:first-child")
                        ?.textContent.toLowerCase() || "";
                const coinName =
                    card
                        .querySelector(".card-details p:nth-child(2)")
                        ?.textContent.toLowerCase() || "";

                // Check if search term matches symbol or name
                const isMatch =
                    coinSymbol.includes(searchTerm) ||
                    coinName.includes(searchTerm);

                // Toggle card visibility
                card.style.display =
                    isMatch || searchTerm === "" ? "flex" : "none";
            });
        });
    }

    // Function to create and append the modal to the document
    function createTrackedCoinsModal() {
        const modalHtml = `
            <div class="modal fade" id="trackedCoinsModal" tabindex="-1" aria-labelledby="trackedCoinsModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="trackedCoinsModalLabel">Tracking Limit Reached</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>You have reached the maximum of 5 tracked coins.</p>
                            <p>Please remove a tracked coin before adding a new one.</p>
                            <div id="trackedCoinsList">
                                <!-- Tracked coins will be dynamically inserted here -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="okAddCoinBtn">Ok</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Create a temporary div to hold the modal HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = modalHtml.trim();

        // Append the modal to the body if it doesn't already exist
        if (!document.getElementById("trackedCoinsModal")) {
            document.body.appendChild(tempDiv.firstChild);
        }
    }

    // Function to manage tracked coins
    function manageTrackedCoins() {
        // Retrieve tracked coins from localStorage
        const savedToggleStates = JSON.parse(
            localStorage.getItem("coinToggleStates") || "{}"
        );

        // Count currently tracked coins
        const trackedCoinsCount = Object.entries(savedToggleStates).filter(
            ([_, isTracked]) => isTracked.isChecked
        ).length;

        return {
            trackedCoinsCount,
            savedToggleStates,
        };
    }

    // Function to clean up localStorage to only keep tracked coins
    function cleanupLocalStorageTrackedCoins(savedToggleStates) {
        // Remove any untracked coins from localStorage
        const cleanedToggleStates = Object.fromEntries(
            Object.entries(savedToggleStates).filter(
                ([_, isTracked]) => isTracked.isChecked
            )
        );

        localStorage.setItem(
            "coinToggleStates",
            JSON.stringify(cleanedToggleStates)
        );

        return cleanedToggleStates;
    }

    // Modify the toggle switch event listener to handle tracking limit
    function setupToggleSwitchListener() {
        // Create the modal first
        createTrackedCoinsModal();

        // Get modal instance
        const trackedCoinsModal = new bootstrap.Modal(
            document.getElementById("trackedCoinsModal")
        );
        const trackedCoinsListEl = document.getElementById("trackedCoinsList");
        const okAddCoinBtn = document.getElementById("okAddCoinBtn");

        // Variable to store the coin that triggered the modal
        let pendingCoinId = null;
        let pendingToggleElement = null;

        // Add event listeners to toggle switches
        const toggleSwitches = document.querySelectorAll(".coin-toggle");
        toggleSwitches.forEach((toggle) => {
            toggle.addEventListener("change", function () {
                const coinId = this.getAttribute("data-coin-id");
                const isChecked = this.checked;
                const coinSymbol = this.closest(".card").querySelector(
                    ".card-details p:first-child"
                ).textContent;

                // Manage tracked coins
                let { trackedCoinsCount, savedToggleStates } =
                    manageTrackedCoins();

                // Clean up localStorage to only keep tracked coins
                savedToggleStates =
                    cleanupLocalStorageTrackedCoins(savedToggleStates);

                // If trying to track beyond 5 coins
                if (isChecked && trackedCoinsCount > 5) {
                    // Prevent the toggle from being checked
                    this.checked = false;

                    // Store the pending coin and toggle element
                    pendingCoinId = coinId;
                    pendingToggleElement = this;

                    // Remove the 6th toggle from localStorage
                    delete savedToggleStates[coinId];
                    localStorage.setItem(
                        "coinToggleStates",
                        JSON.stringify(savedToggleStates)
                    );

                    // Clear previous list
                    trackedCoinsListEl.innerHTML = ``;

                    // Populate tracked coins list
                    Object.entries(savedToggleStates)
                        .filter(([_, isTracked]) => isTracked.isChecked)
                        .forEach(([trackedCoinId, trackedCoin]) => {
                            const coinEl = document
                                .querySelector(`#toggle-${trackedCoinId}`)
                                .closest(".card");
                            const coinName = coinEl.querySelector(
                                ".card-details p:nth-child(2)"
                            ).textContent;

                            const coinItemEl = document.createElement("div");
                            coinItemEl.classList.add(
                                "tracked-coin-item",
                                "d-flex",
                                "justify-content-between",
                                "align-items-center",
                                "mb-2",
                                "p-2",
                                "border",
                                "rounded"
                            );
                            coinItemEl.innerHTML = `
                                <span>${coinName}</span>
                                <button class="btn btn-sm btn-outline-danger remove-tracked-coin" data-coin-id="${trackedCoinId}">Remove</button>
                            `;

                            trackedCoinsListEl.appendChild(coinItemEl);
                        });

                    // Show the modal
                    trackedCoinsModal.show();

                    // Add event listeners to remove buttons
                    const removeButtons = trackedCoinsListEl.querySelectorAll(
                        ".remove-tracked-coin"
                    );
                    removeButtons.forEach((button) => {
                        button.addEventListener("click", function () {
                            const coinIdToRemove =
                                this.getAttribute("data-coin-id");

                            // Uncheck the toggle for this coin
                            const toggleToRemove = document.getElementById(
                                `toggle-${coinIdToRemove}`
                            );
                            toggleToRemove.checked = false;

                            // Update localStorage
                            savedToggleStates[coinIdToRemove].isChecked = false;
                            // Clean up localStorage
                            savedToggleStates =
                                cleanupLocalStorageTrackedCoins(
                                    savedToggleStates
                                );

                            // Remove the coin from the list
                            this.closest(".tracked-coin-item").remove();

                            // Check if list is now empty
                            if (trackedCoinsListEl.children.length === 0) {
                                trackedCoinsModal.hide();
                            }
                        });
                    });

                    return;
                }

                // Manually update popover content
                const popoverInstance = bootstrap.Popover.getInstance(this);
                if (popoverInstance) {
                    popoverInstance.dispose(); // Remove existing popover
                }

                // Recreate popover with new content
                new bootstrap.Popover(this, {
                    content: isChecked ? "Tracking" : "Not Tracking",
                    trigger: "hover",
                });

                // Only update localStorage if tracking is within limit
                if (trackedCoinsCount < 5 || !isChecked) {
                    // Update the toggle state for this specific coin
                    savedToggleStates[coinId] = {
                        symbol: coinSymbol,
                        isChecked: isChecked,
                    };

                    // Clean up localStorage
                    savedToggleStates =
                        cleanupLocalStorageTrackedCoins(savedToggleStates);
                }
            });
        });

        // Add event listener to Ok button
        okAddCoinBtn.addEventListener("click", function () {
            // Check current tracked coins count
            const { trackedCoinsCount, savedToggleStates } =
                manageTrackedCoins();

            if (
                trackedCoinsCount < 5 &&
                pendingCoinId &&
                pendingToggleElement
            ) {
                // Check the toggle
                pendingToggleElement.checked = true;

                // Update localStorage
                savedToggleStates[pendingCoinId] = {
                    symbol: pendingToggleElement
                        .closest(".card")
                        .querySelector(".card-details p:first-child")
                        .textContent,
                    isChecked: true,
                };
                // Clean up and save localStorage
                cleanupLocalStorageTrackedCoins(savedToggleStates);

                // Manually update popover
                const popoverInstance =
                    bootstrap.Popover.getInstance(pendingToggleElement);
                if (popoverInstance) {
                    popoverInstance.dispose();
                }
                new bootstrap.Popover(pendingToggleElement, {
                    content: "Tracking",
                    trigger: "hover",
                });

                // Close the modal
                trackedCoinsModal.hide();

                // Reset pending coin
                pendingCoinId = null;
                pendingToggleElement = null;
            }
        });
    }

    let chartInstance = null;
    let chartInterval = null;

    function initCryptoChart() {
        // console.log("DEBUG: Initializing Crypto Chart");

        const chartContainer = document.getElementById("chartContainer");
        if (!chartContainer) {
            console.error("Chart container not found!");
            return;
        }

        // Ensure container has definite dimensions
        chartContainer.style.width = "100%";
        chartContainer.style.minHeight = "500px";
        chartContainer.style.height = "500px";
        chartContainer.style.display = "block";
        chartContainer.style.visibility = "visible";
        chartContainer.style.position = "relative";

        // Clear any existing content
        chartContainer.innerHTML = "";

        // Ensure DOM is fully loaded and rendered
        requestAnimationFrame(() => {
            // Force reflow to ensure dimensions are calculated
            chartContainer.offsetHeight;

            // Check if any coins are tracked
            const savedToggleStates = JSON.parse(
                localStorage.getItem("coinToggleStates") || "{}"
            );
            const trackedCoins = Object.entries(savedToggleStates)
                .filter(([_, coinData]) => coinData.isChecked)
                .map(([_, coinData]) => coinData.symbol.trim().toUpperCase());

            console.log("DEBUG: Tracked Coin Symbols", trackedCoins);

            if (trackedCoins.length === 0) {
                chartContainer.innerHTML =
                    '<p class="text-center">No coins tracked. Please enable tracking for at least one coin.</p>';
                console.warn(
                    "No coins tracked. Skipping chart initialization."
                );
                return;
            }

            // Verify container dimensions
            const containerWidth = chartContainer.offsetWidth;
            const containerHeight = chartContainer.offsetHeight;
            console.log("DEBUG: Container Dimensions", {
                width: containerWidth,
                height: containerHeight,
            });

            // Ensure we have valid dimensions
            if (containerWidth <= 0 || containerHeight <= 0) {
                console.error("Invalid container dimensions");
                return;
            }

            console.log("DEBUG: Tracked Symbols", trackedCoins);

            // Prepare data series
            const dataSeries = trackedCoins.map((symbol) => ({
                type: "line",
                name: symbol,
                showInLegend: true,
                legendText: symbol,
                markerType: "circle",
                markerSize: 7,
                dataPoints: [],
            }));

            // Create chart instance with explicit dimensions
            let chartInstance = null;
            try {
                chartInstance = new CanvasJS.Chart("chartContainer", {
                    width: containerWidth,
                    height: containerHeight,
                    responsive: true,
                    animationEnabled: true,
                    exportEnabled: true,
                    theme: "light2",
                    toolTip: {
                        enabled: true,
                        shared: true,
                        contentFormatter: function (e) {
                            let content = "";
                            e.entries.forEach(function (entry) {
                                content += `<strong>${
                                    entry.dataSeries.name
                                }</strong>: $${entry.dataPoint.y.toFixed(
                                    2
                                )}<br/>`;
                            });
                            return content;
                        },
                        borderColor: "#ccc",
                        cornerRadius: 4,
                        backgroundColor: "rgba(255,255,255,0.9)",
                    },
                    title: {
                        text: "Cryptocurrency Prices (USD)",
                        fontSize: 20,
                    },
                    axisX: {
                        title: "Time",
                        valueFormatString: "HH:mm:ss",
                        labelFontSize: 12,
                    },
                    axisY: {
                        title: "Price (USD)",
                        includeZero: false,
                        labelFontSize: 12,
                        logarithmic: true,
                    },
                    legend: {
                        verticalAlign: "bottom",
                        horizontalAlign: "center",
                        fontSize: 14,
                        fontFamily: "Helvetica, Arial, sans-serif",
                        cursor: "pointer",
                    },
                    data: dataSeries,
                });

                // Render chart
                chartInstance.render();
                console.log("Chart rendered successfully");
            } catch (renderError) {
                console.error("Failed to create or render chart:", renderError);
                return;
            }

            // Async function to update prices
            async function updatePrices() {
                try {
                    // Validate tracked coins
                    if (trackedCoins.length === 0) {
                        console.warn("No tracked coins to fetch prices for");
                        return;
                    }

                    const response = await axios.get(
                        `https://min-api.cryptocompare.com/data/pricemulti`,
                        {
                            params: {
                                api_key:
                                    "38d69c8f2013d9b56667b5cb09e1718d9c28cb71797f2bcac79d4e524f9bc9f9",
                                fsyms: trackedCoins.join(","),
                                tsyms: "USD",
                            },
                        }
                    );

                    const data = response.data;
                    console.log("Price Data:", data);
                    const now = new Date();

                    // Reset data series if needed
                    if (dataSeries.length !== trackedCoins.length) {
                        dataSeries.length = 0;
                        trackedCoins.forEach((symbol) => {
                            dataSeries.push({
                                type: "line",
                                name: symbol,
                                showInLegend: true,
                                legendText: symbol,
                                markerType: "circle",
                                markerSize: 7,
                                dataPoints: [],
                            });
                        });
                    }

                    trackedCoins.forEach((symbol, index) => {
                        if (data[symbol]?.USD) {
                            const price = data[symbol].USD;
                            console.log(`Price for ${symbol}: ${price}`);
                            dataSeries[index].dataPoints.push({
                                x: now,
                                y: price,
                            });
                            if (dataSeries[index].dataPoints.length > 10) {
                                dataSeries[index].dataPoints.shift();
                            }
                        } else {
                            console.warn(`No price data for ${symbol}`);
                        }
                    });

                    chartInstance.render();
                } catch (error) {
                    console.error(
                        "Error fetching prices:",
                        error.response ? error.response.data : error.message
                    );
                }
            }

            // Start price updates
            updatePrices();
            const chartInterval = setInterval(updatePrices, 2000);

            // Expose chart control methods globally
            window.chartInstance = chartInstance;
            window.chartInterval = chartInterval;
            window.stopCryptoChart = function () {
                console.log("Stopping Chart Updates...");
                clearInterval(chartInterval);
                chartInstance.destroy();
            };
        });
    }

    function init() {
        setupNavigation();
        loadCoins().then(() => {
            setupSearch();
            setupToggleSwitchListener();
        });
    }

    document.addEventListener("DOMContentLoaded", init);
})();
