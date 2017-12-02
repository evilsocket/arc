TARGET=vaultd

all: build
	@echo "@ Done"
	@echo -n "\n"

build:
	@echo "@ Building ..."
	@go build $(FLAGS) -o $(TARGET) .

clean:
	@rm -rf $(TARGET)
