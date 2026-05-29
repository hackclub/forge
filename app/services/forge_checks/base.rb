module ForgeChecks
  class Base
    class << self
      def key
        name.demodulize.underscore
      end

      def label
        raise NotImplementedError
      end

      def source
        raise NotImplementedError
      end

      def needs_ai?
        false
      end

      def call(ctx)
        new(ctx).call
      end
    end

    attr_reader :ctx

    def initialize(ctx)
      @ctx = ctx
    end

    def call
      raise NotImplementedError
    end

    private

    def pass(message = nil)
      result("pass", message)
    end

    def fail!(message)
      result("fail", message)
    end

    def uncertain(message)
      result("uncertain", message)
    end

    def skipped(message)
      result("skipped", message)
    end

    def result(verdict, reasoning)
      Result.new(
        key: self.class.key,
        name: self.class.label,
        source: self.class.source,
        verdict: verdict,
        reasoning: reasoning
      )
    end
  end
end
