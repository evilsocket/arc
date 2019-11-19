.PHONY: build test install

SRC_PATH=cmd/arc/*.go
TARGET=arc
PREFIX_DIR=/usr/local
BIN_DIR=$(PREFIX_DIR)/bin
CONFIG_DIR=$(PREFIX_DIR)/etc
SERVICE_DIR=/lib/systemd/system
SERVICE_LN_DIR=/etc/systemd/system

all: build

build: assets
	@mkdir -p build
	@go build $(FLAGS) -o build/$(TARGET) $(SRC_PATH)

assets: bindata
	@rm -rf webui/compiled.go
	@go-bindata -o webui/compiled.go -pkg webui webui/...

bindata:
	@go get -u github.com/jteeuwen/go-bindata/...

test:
	@go test $(SRC_PATH)/...

clean:
	@rm -rf build

install: build
	@echo "Installing $(TARGET) in $(PREFIX_DIR)"
	@install -D -m 744 build/$(TARGET) $(BIN_DIR)/$(TARGET)
	@setcap 'cap_net_bind_service=+ep' $(BIN_DIR)/$(TARGET)
	@install -D -m 644 sample_config.json $(CONFIG_DIR)/$(TARGET)/config.json
	@install -D -m 644 arc.service $(SERVICE_DIR)/arc.service
	@ln -s $(SERVICE_DIR)/arc.service $(SERVICE_LN_DIR)/arc.service || echo "symlink already exists...skipping"
	@echo "Done."
